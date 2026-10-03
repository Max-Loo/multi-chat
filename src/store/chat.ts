import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Chat, ChatMeta, ChatRoleEnum, RunningChatEntry, StandardMessage, chatToMeta } from "@/types/chat";
import { loadChatIndex, loadChatById, saveChatAndIndex, deleteChatFromStorage } from "./storage";
import { Model } from "@/types/model";
import { streamChatCompletion, generateChatTitleService } from "@/services/chat";
import { isNil, isNotNil } from "es-toolkit";
import { createIdGenerator } from 'ai'
import { USER_MESSAGE_ID_PREFIX } from "@/utils/constants";
import { getCurrentTimestamp } from "@/utils/utils";
import { useAppConfigStore } from "./appConfig";
import { useModelsStore } from "./models";
import { getProviderSDKLoader } from "@/services/chat/providerLoader";
import { ModelProviderKeyEnum } from "@/utils/enums";
import {
  commitEdit as commitEditHelper,
  rollbackEdit as rollbackEditHelper,
  commitRegenerate as commitRegenerateHelper,
  rollbackRegenerate as rollbackRegenerateHelper,
  updateHistoryContent as updateHistoryContentHelper,
  findMessageIndex,
  getCurrentContent,
  getContentAtIndex,
} from "@/services/chat/chatHistoryHelper";

// 生成用户消息 ID 的工具函数（带前缀）
const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX });

/**
 * 聊天状态接口
 */
export interface ChatSliceState {
  // 聊天元数据列表（从 chat_index 加载，过滤掉 isDeleted）
  chatMetaList: ChatMeta[];
  // 按需加载的完整聊天数据，key 是 chatId
  activeChatData: Record<string, Chat>;
  // 正在发送消息的聊天 ID 集合，防止发送中被释放
  sendingChatIds: Record<string, boolean>;
  // 加载状态
  loading: boolean;
  // 当前选中的要展示的聊天的Id
  selectedChatId: string | null;
  // 操作错误信息
  error: string | null;
  // 初始化错误信息
  initializationError: string | null;
  // 当前正在运行中的聊天（还有网络传输）。chatId - modelId - history
  runningChat: Record<string, Record<string, RunningChatEntry>>;
}

/**
 * 聊天 store
 * 转写自 Redux chatSlice + chatMiddleware（自动标题生成与聊天持久化副作用并入本 store）
 */
export const useChatStore = defineStore('chat', () => {
  // 聊天元数据列表
  const chatMetaList = ref<ChatMeta[]>([]);
  // 按需加载的完整聊天数据，key 是 chatId
  const activeChatData = ref<Record<string, Chat>>({});
  // 正在发送消息的聊天 ID 集合
  const sendingChatIds = ref<Record<string, boolean>>({});
  // 加载状态
  const loading = ref(false);
  // 当前选中的要展示的聊天的Id
  const selectedChatId = ref<string | null>(null);
  // 操作错误信息
  const error = ref<string | null>(null);
  // 初始化错误信息
  const initializationError = ref<string | null>(null);
  // 当前正在运行中的聊天（还有网络传输）
  const runningChat = ref<Record<string, Record<string, RunningChatEntry>>>({});

  // 用于防止多模型并发时重复生成标题的内存锁（原 chatMiddleware）
  const generatingTitleChatIds = new Set<string>();

  /**
   * 重置聊天 store 的模块级状态（仅用于测试）
   * 对应原 resetChatMiddleware
   */
  function resetChatStore(): void {
    generatingTitleChatIds.clear();
  }

  // ==================== 内部工具函数（原模块级 helper） ====================

  /**
   * 在 activeChatData 中定位指定聊天的模型，将消息追加到其历史记录中
   * @param chatId 目标聊天 ID
   * @param modelId 目标模型 ID
   * @param message 要追加的消息，为 null 时静默跳过
   * @returns 追加成功返回 true，聊天/模型不存在或消息为 null 时返回 false
   */
  function appendHistoryToModel(chatId: string, modelId: string, message: StandardMessage | null): boolean {
    if (isNil(message)) return false

    const chat = activeChatData.value[chatId]
    if (!chat) {
      console.error(`appendHistoryToModel: activeChatData[${chatId}] 不存在`)
      return false
    }

    const chatModelList = chat.chatModelList
    if (!chatModelList) return false

    const modelIdx = chatModelList.findIndex(item => item.modelId === modelId)
    if (modelIdx === -1) return false

    if (!Array.isArray(chatModelList[modelIdx].chatHistoryList)) {
      chatModelList[modelIdx].chatHistoryList = []
    }
    chatModelList[modelIdx].chatHistoryList.push(message)
    return true
  }

  /**
   * 更新 chatMetaList 中指定聊天的元数据
   */
  function updateMetaInList(chatId: string, update: Partial<ChatMeta>): void {
    const metaIdx = chatMetaList.value.findIndex(m => m.id === chatId);
    if (metaIdx !== -1) {
      chatMetaList.value[metaIdx] = { ...chatMetaList.value[metaIdx], ...update };
    }
  }

  /**
   * 构造传给 chatHistoryHelper 的 state 视图
   */
  function chatStateLike() {
    return {
      activeChatData: activeChatData.value,
      runningChat: runningChat.value,
    };
  }

  // ==================== 持久化副作用（原 chatMiddleware） ====================

  /**
   * 将指定聊天的数据保存到存储
   * @param chatId 聊天 ID
   * @param chatData 聊天数据
   */
  async function persistChat(chatId: string, chatData: Chat): Promise<void> {
    const index = await loadChatIndex();
    await saveChatAndIndex(chatId, chatData, index);
  }

  /**
   * 从 activeChatData 持久化指定聊天（数据未加载时跳过）
   */
  async function persistChatFromActive(chatId: string): Promise<void> {
    const chatData = activeChatData.value[chatId];
    if (chatData) {
      await persistChat(chatId, chatData);
    }
  }

  /**
   * 删除聊天后的持久化与 URL 清理（原 deleteChat 的 middleware effect）
   */
  async function persistChatDeletion(chatId: string): Promise<void> {
    const index = await loadChatIndex();
    await deleteChatFromStorage(chatId, index);

    // 防御性兜底：如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
    if (selectedChatId.value === chatId) {
      const url = new URL(window.location.href);
      if (url.searchParams.has("chatId")) {
        url.searchParams.delete("chatId");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    }
  }

  // ==================== 同步 actions（原 reducers） ====================

  /**
   * 设置当前的聊天元数据列表
   */
  function setChatMetaList(payload: ChatMeta[]): void {
    chatMetaList.value = [...payload]
  }

  /**
   * 设置当前选中的聊天ID
   */
  function setSelectedChatId(chatId: string | null): void {
    selectedChatId.value = chatId
  }

  /**
   * 清除操作错误信息
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 清除初始化错误信息
   */
  function clearInitializationError(): void {
    initializationError.value = null;
  }

  /**
   * 新增聊天（并持久化）
   */
  async function createChat(payload: { chat: Chat }): Promise<void> {
    const chat = payload.chat;
    // 初始化 updatedAt
    if (chat.updatedAt === undefined) {
      chat.updatedAt = getCurrentTimestamp();
    }
    // 同时更新 chatMetaList 和 activeChatData
    chatMetaList.value.unshift(chatToMeta(chat));
    activeChatData.value[chat.id] = chat;

    // 持久化（原 middleware 监听 createChat）
    await persistChat(chat.id, chat);
  }

  /**
   * 编辑聊天（并持久化）
   */
  async function editChat(payload: { chat: Chat }): Promise<void> {
    const { chat } = payload

    // 更新 updatedAt
    chat.updatedAt = getCurrentTimestamp();

    // 更新 activeChatData
    activeChatData.value[chat.id] = { ...chat };

    // 更新 chatMetaList
    updateMetaInList(chat.id, chatToMeta(chat));

    // 持久化（原 middleware 监听 editChat）
    await persistChat(chat.id, chat);
  }

  /**
   * 编辑聊天的名称（并持久化）
   * 验证：不允许空标题；超长标题静默截断到 20 个字符
   */
  async function editChatName(payload: { name: string; id: string }): Promise<void> {
    const { id, name } = payload

    // 验证：不允许空标题（包括空字符串和仅空白字符）
    if (!name || name.trim() === '') {
      return; // 静默拒绝，不更新状态
    }

    // 超长标题静默截断到 20 个字符
    const trimmedName = name.length > 20 ? name.slice(0, 20) : name;

    const now = getCurrentTimestamp();

    // 更新 chatMetaList
    const metaIdx = chatMetaList.value.findIndex(m => m.id === id);
    if (metaIdx !== -1) {
      chatMetaList.value[metaIdx].name = trimmedName;
      chatMetaList.value[metaIdx].isManuallyNamed = true;
      chatMetaList.value[metaIdx].updatedAt = now;
    }

    // 更新 activeChatData（若已加载）
    let chatData = activeChatData.value[id];
    if (chatData) {
      chatData.name = trimmedName;
      chatData.isManuallyNamed = true;
      chatData.updatedAt = now;
    }

    // 持久化（原 middleware 监听 editChatName；聊天未加载时从存储读取后应用重命名）
    if (!chatData) {
      const stored = await loadChatById(id);
      if (stored) {
        stored.name = trimmedName;
        stored.isManuallyNamed = true;
        stored.updatedAt = chatMetaList.value.find(m => m.id === id)?.updatedAt;
        chatData = stored;
      }
    }
    if (chatData) {
      await persistChat(id, chatData);
    }
  }

  /**
   * 删除聊天（并持久化；正在发送的聊天跳过）
   */
  async function deleteChat(payload: { chat: Chat }): Promise<void> {
    const { chat } = payload

    // 检查是否正在发送，若正在发送则跳过
    if (sendingChatIds.value[chat.id]) {
      return;
    }

    // 从 chatMetaList 彻底移除（非软标记）
    chatMetaList.value = chatMetaList.value.filter(m => m.id !== chat.id);

    // 从 activeChatData 中移除
    delete activeChatData.value[chat.id];

    // 判断「是否当前选中的聊天正好是需要被删除的」
    if (selectedChatId.value === chat.id) {
      selectedChatId.value = null;
    }

    // 持久化 + URL 清理（原 middleware 监听 deleteChat）
    await persistChatDeletion(chat.id);
  }

  /**
   * 设置当前活跃聊天数据
   */
  function setActiveChatData(payload: { chatId: string; chat: Chat }): void {
    activeChatData.value[payload.chatId] = payload.chat;
  }

  /**
   * 清理指定聊天的活跃数据（跳过正在发送的聊天）
   */
  function clearActiveChatData(chatId: string): void {
    // 跳过正在发送的聊天
    if (sendingChatIds.value[chatId]) {
      return;
    }
    delete activeChatData.value[chatId];
  }

  /**
   * 发送结束后回收非当前选中聊天的 activeChatData
   */
  function releaseCompletedBackgroundChat(chatId: string): void {
    if (selectedChatId.value !== chatId) {
      delete activeChatData.value[chatId];
    }
  }

  /**
   * 向当前聊天的运行记录添加内容
   */
  function pushRunningChatHistory(payload: {
    chat: Chat;
    model: Model;
    message: StandardMessage;
  }): void {
    runningChat.value[payload.chat.id][payload.model.id].history = payload.message
  }

  /**
   * 向聊天历史记录添加内容
   */
  function pushChatHistory(payload: {
    chat: Chat;
    model: Model;
    message: StandardMessage;
  }): void {
    appendHistoryToModel(payload.chat.id, payload.model.id, payload.message)
  }

  /**
   * 提交编辑：原子更新用户消息和 AI 回复的 content 数组
   */
  function commitEdit(payload: {
    chatId: string;
    userMessageId: string;
    newContent: string;
  }): boolean {
    return commitEditHelper(chatStateLike(), payload.chatId, payload.userMessageId, payload.newContent);
  }

  /**
   * 回滚编辑：恢复用户消息和 AI 回复到编辑前的状态
   */
  function rollbackEdit(payload: {
    chatId: string;
    userMessageId: string;
  }): boolean {
    return rollbackEditHelper(chatStateLike(), payload.chatId, payload.userMessageId);
  }

  /**
   * 提交重新生成：将旧 AI 回复 push 进数组，追加空字符串占位
   */
  function commitRegenerate(payload: {
    chatId: string;
    assistantMessageId: string;
    historyIndex?: number;
  }): boolean {
    return commitRegenerateHelper(chatStateLike(), payload.chatId, payload.assistantMessageId, payload.historyIndex);
  }

  /**
   * 回滚重新生成：弹出 AI 回复数组中的占位元素
   */
  function rollbackRegenerate(payload: {
    chatId: string;
    assistantMessageId: string;
    historyIndex?: number;
  }): boolean {
    return rollbackRegenerateHelper(chatStateLike(), payload.chatId, payload.assistantMessageId, payload.historyIndex);
  }

  /**
   * 流式完成后更新 AI 回复的 content/reasoningContent 数组目标元素
   */
  function updateHistoryContent(payload: {
    chatId: string;
    modelId: string;
    messageIndex: number;
    content: string;
    reasoningContent?: string;
    historyIndex?: number;
  }): boolean {
    return updateHistoryContentHelper(
      chatStateLike(),
      payload.chatId,
      payload.modelId,
      payload.messageIndex,
      payload.content,
      payload.reasoningContent,
      payload.historyIndex,
    );
  }

  /**
   * 编辑/重新生成时初始化 runningChat 结构
   * 对应原 'chatModel/editRegenerateInit' action
   */
  function editRegenerateInit(payload: { chatId: string; modelId: string }): void {
    if (isNil(runningChat.value[payload.chatId])) {
      runningChat.value[payload.chatId] = {};
    }
    if (isNil(runningChat.value[payload.chatId][payload.modelId])) {
      runningChat.value[payload.chatId][payload.modelId] = {
        isSending: true,
        history: null,
      };
    }
  }

  // ==================== 异步 actions（原 thunks） ====================

  /**
   * 初始化聊天列表，加载索引元数据（过滤掉 isDeleted）
   * @returns 过滤后的聊天元数据列表
   */
  async function initializeChatList(): Promise<ChatMeta[]> {
    // pending
    loading.value = true;
    initializationError.value = null;

    try {
      const index: ChatMeta[] = await loadChatIndex();
      // 过滤掉已删除的聊天
      chatMetaList.value = index.filter(meta => !meta.isDeleted);
      loading.value = false;
      return chatMetaList.value;
    } catch (err) {
      // rejected
      loading.value = false;
      const message = err instanceof Error ? err.message : 'Failed to initialize chat data';
      initializationError.value = message;
      throw new Error(message, { cause: err });
    }
  }

  /**
   * 针对某个聊天的每个模型来发送消息
   * 发送完成后触发自动标题生成（原 chatMiddleware 监听 sendMessage.fulfilled）
   */
  async function sendMessage(
    args: {
      chat: Chat;
      message: string;
      model: Model;
      historyList: StandardMessage[];
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const { chat, message, model, historyList } = args
    const signal = options?.signal

    // pending：初始化 runningChat 结构
    if (isNil(runningChat.value[chat.id])) {
      runningChat.value[chat.id] = {}
    }

    if (isNil(runningChat.value[chat.id][model.id])) {
      runningChat.value[chat.id][model.id] = {
        isSending: true,
        history: null,
        errorMessage: '',
      }
    } else {
      runningChat.value[chat.id][model.id].isSending = true
      runningChat.value[chat.id][model.id].errorMessage = ''
    }

    // 先将当前要发送的内容记录进历史记录
    pushChatHistory({
      chat,
      model,
      message: {
        id: generateUserMessageId(),
        role: ChatRoleEnum.USER,
        content: message,
        timestamp: getCurrentTimestamp(),
        modelKey: model.modelKey,
        finishReason: null,
      },
    })

    // 获取是否传输推理内容的开关状态
    const appConfigStore = useAppConfigStore();
    const transmitHistoryReasoning = appConfigStore.transmitHistoryReasoning;

    try {
      // 使用 ChatService 发起流式聊天请求
      const fetchResponse = streamChatCompletion(
        {
          model,
          historyList,
          message,
          transmitHistoryReasoning,
        },
        { signal },
      )

      // 以流式响应处理，但每次的 element 都是最新完整内容，并非增量
      for await (const element of fetchResponse) {
        if (signal?.aborted) {
          break
        }
        // 将每条记录放进运行中的记录，以便展示
        pushRunningChatHistory({ chat, model, message: element })
      }

      // fulfilled：将临时数据写回到数组
      const currentChatModel = runningChat.value[chat.id][model.id]
      currentChatModel.isSending = false

      // 将临时的数据回写到 activeChatData 中，追加失败时跳过清理
      if (!appendHistoryToModel(chat.id, model.id, currentChatModel.history)) return

      // 更新 updatedAt
      const activeChat = activeChatData.value[chat.id];
      if (activeChat) {
        activeChat.updatedAt = getCurrentTimestamp();
        updateMetaInList(chat.id, { updatedAt: activeChat.updatedAt });
      }

      // 清理临时数据
      delete runningChat.value[chat.id][model.id]

      // 发送完成后检测是否需要自动生成标题（原 middleware 的 sendMessage.fulfilled 监听）
      await maybeGenerateChatTitle(chat, model);
    } catch (err) {
      // rejected：取消发送状态，记录错误信息
      const streamError = err as Error
      const currentChatModel = runningChat.value[chat.id]?.[model.id]
      if (currentChatModel) {
        currentChatModel.isSending = false
        currentChatModel.errorMessage = (streamError.message ?? '') + (streamError.stack ?? '')
      }

      console.error('❌ 聊天消息发送失败:', {
        chatId: chat.id,
        chatName: chat.name,
        modelId: model.id,
        modelName: model.modelName,
        modelKey: model.modelKey,
        errorName: streamError.name,
        errorMessage: streamError.message,
        errorStack: streamError.stack,
      });

      throw err
    }
  }

  /**
   * 检测是否需要触发自动标题生成（原 chatMiddleware 的 sendMessage.fulfilled effect）
   * 条件：未在生成中、未手动命名、自动命名开关开启、标题为空、对话长度为 2
   */
  async function maybeGenerateChatTitle(chat: Chat, model: Model): Promise<void> {
    // 检查是否正在生成标题（防止竞态条件）
    if (generatingTitleChatIds.has(chat.id)) {
      return;
    }

    // 从 activeChatData 获取聊天数据
    const currentChat = activeChatData.value[chat.id];
    if (!currentChat) {
      return;
    }

    // 条件 1：用户未手动命名
    if (currentChat.isManuallyNamed === true) {
      return;
    }

    // 条件 2：全局开关已开启
    const appConfigStore = useAppConfigStore();
    if (!appConfigStore.autoNamingEnabled) {
      return;
    }

    // 条件 3：聊天标题为空
    if (currentChat.name !== '' && currentChat.name !== undefined) {
      return;
    }

    // 条件 4：对话长度为 2（第一条用户消息 + 第一条 AI 回复）
    const chatModel = currentChat.chatModelList?.find(cm => cm.modelId === model.id);
    if (!chatModel || chatModel.chatHistoryList.length !== 2) {
      return;
    }

    // 所有条件满足，触发标题生成（锁在生成结束后释放，对应原 fulfilled/rejected 监听）
    generatingTitleChatIds.add(chat.id);
    try {
      await generateChatName({
        chat: currentChat,
        model,
        historyList: chatModel.chatHistoryList,
      });
    } finally {
      generatingTitleChatIds.delete(chat.id);
    }
  }

  /**
   * 生成聊天标题（成功后更新状态并持久化，失败静默处理）
   */
  async function generateChatName(args: {
    chat: Chat;
    model: Model;
    historyList: StandardMessage[];
  }): Promise<{ chatId: string; name: string } | null> {
    const { chat, model, historyList } = args;
    try {
      // 检查全局开关状态
      const appConfigStore = useAppConfigStore();
      if (!appConfigStore.autoNamingEnabled) {
        return null;
      }

      // 调用标题生成服务
      const title = await generateChatTitleService(historyList, model);

      // fulfilled：更新 chatMetaList 与 activeChatData
      const now = getCurrentTimestamp();

      const metaIdx = chatMetaList.value.findIndex(m => m.id === chat.id);
      if (metaIdx !== -1) {
        chatMetaList.value[metaIdx].name = title;
        chatMetaList.value[metaIdx].updatedAt = now;
      }

      const activeChat = activeChatData.value[chat.id];
      if (activeChat) {
        activeChat.name = title;
        activeChat.updatedAt = now;
      }

      // 持久化（原 middleware 监听 generateChatName.fulfilled）
      await persistChatFromActive(chat.id);

      return { chatId: chat.id, name: title };
    } catch (err) {
      // 静默处理错误，记录警告日志
      console.warn('Failed to generate chat title:', err);
      return null;
    }
  }

  /**
   * 切换聊天并预加载供应商 SDK + 加载完整数据
   */
  async function setSelectedChatIdWithPreload(chatId: string | null): Promise<void> {
    if (!chatId) {
      applySelectedChat(chatId, undefined);
      return;
    }

    // 从 activeChatData 中查找
    let chatData = activeChatData.value[chatId];

    // 如果未加载，从存储读取
    if (!chatData) {
      const loaded = await loadChatById(chatId);
      if (!loaded) {
        console.warn(`Chat ${chatId} not found in storage`);
        applySelectedChat(chatId, undefined);
        return;
      }
      chatData = loaded;
    }

    // 预加载聊天使用的供应商 SDK（优化手段，不阻塞聊天切换）
    const { chatModelList = [] } = chatData;

    // 新聊天（无模型）不预加载
    if (chatModelList.length !== 0) {
      try {
        const providerSDKLoader = getProviderSDKLoader();
        const modelsStore = useModelsStore();

        // 提取聊天使用的所有 providerKey
        const providerKeys = new Set<ModelProviderKeyEnum>();
        for (const chatModel of chatModelList) {
          const model = modelsStore.models.find(m => m.id === chatModel.modelId);
          if (model) {
            providerKeys.add(model.providerKey);
          }
        }

        // 预加载对应的供应商 SDK
        if (providerKeys.size > 0) {
          await providerSDKLoader.preloadProviders(Array.from(providerKeys));
        }
      } catch (err) {
        // 预加载失败不影响聊天切换，仅记录警告
        console.warn('Failed to preload provider SDKs:', err);
      }
    }

    applySelectedChat(chatId, chatData);
  }

  /**
   * 应用聊天切换结果（原 setSelectedChatIdWithPreload.fulfilled reducer）
   */
  function applySelectedChat(chatId: string | null, chatData?: Chat): void {
    const previousChatId = selectedChatId.value;

    selectedChatId.value = chatId;

    // 加载新聊天数据到 activeChatData
    if (chatId && chatData) {
      activeChatData.value[chatId] = chatData;
    }

    // 清理上一个聊天的数据（跳过正在发送的聊天）
    if (previousChatId && previousChatId !== chatId) {
      if (!sendingChatIds.value[previousChatId]) {
        delete activeChatData.value[previousChatId];
      }
    }
  }

  /**
   * 触发发送聊天消息（对全部启用模型并发发送；结束后持久化并回收后台聊天数据）
   */
  async function startSendChatMessage(
    args: { chat: Chat; message: string },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const { chat, message } = args
    const signal = options?.signal

    // pending：将 chatId 加入 sendingChatIds
    sendingChatIds.value[chat.id] = true;

    try {
      const modelsStore = useModelsStore();

      await Promise.all(chat.chatModelList?.map((chatModel) => {
        const model = modelsStore.models.find(m => m.id === chatModel.modelId)
        // 只有当模型没有被删除，且已经启用的时候，才会进行发送
        if (isNotNil(model) && !model.isDeleted && model.isEnable) {
          return sendMessage({
            chat,
            message,
            model,
            historyList: chatModel.chatHistoryList,
          }, {
            // 传递令牌，使得能够中断
            signal,
          })
        }
        return undefined;
      }) ?? [])
    } catch (err) {
      // rejected：将 runningChat 中剩余数据回写到 activeChatData
      const currentChat = runningChat.value[chat.id]
      if (isNotNil(currentChat)) {
        Object.entries(currentChat).forEach(([modelId, historyItem]) => {
          appendHistoryToModel(chat.id, modelId, historyItem.history)
        })
      }
      throw err
    } finally {
      // 将 chatId 从 sendingChatIds 移除
      delete sendingChatIds.value[chat.id];

      // 持久化（原 middleware 监听 startSendChatMessage.fulfilled/rejected）
      await persistChatFromActive(chat.id);

      // 发送结束后，回收非当前选中聊天的 activeChatData
      if (selectedChatId.value !== chat.id) {
        releaseCompletedBackgroundChat(chat.id);
      }
    }
  }

  /**
   * 编辑最新用户消息并重新生成 AI 回复
   */
  async function editAndResendMessage(
    args: {
      chatId: string;
      userMessageId: string;
      newContent: string;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const { chatId, userMessageId, newContent } = args
    const signal = options?.signal

    // pending
    sendingChatIds.value[chatId] = true;

    try {
      const chat = activeChatData.value[chatId];
      if (!chat?.chatModelList) return;

      // 1. 提交编辑（原子更新数组）
      commitEdit({ chatId, userMessageId, newContent });

      // 2. 重新获取最新状态（commitEdit 已更新 chatHistoryList）
      const updatedChat = activeChatData.value[chatId];
      if (!updatedChat?.chatModelList) return;

      const modelsStore = useModelsStore();
      const models = modelsStore.models;

      // 通过位置索引获取 userMessageIndex
      const userMessageIndex = findMessageIndex(chatStateLike(), chatId, userMessageId);
      if (userMessageIndex === -1) return;

      const appConfigStore = useAppConfigStore();

      // 3. 对每个启用模型裁剪历史并调用流式生成
      await Promise.all(updatedChat.chatModelList.map((chatModel) => {
        const model = models.find(m => m.id === chatModel.modelId);
        if (isNil(model) || model.isDeleted || !model.isEnable) return;

        // 裁剪历史：不包含编辑的用户消息和旧 AI 回复（用户消息通过 message 参数追加）
        const trimmedHistory = chatModel.chatHistoryList.slice(0, userMessageIndex);
        const transmitHistoryReasoning = appConfigStore.transmitHistoryReasoning;

        return (async () => {
          // 初始化 runningChat 结构
          editRegenerateInit({ chatId, modelId: model.id });

          const fetchResponse = streamChatCompletion(
            {
              model,
              historyList: trimmedHistory,
              message: newContent,
              transmitHistoryReasoning,
            },
            { signal },
          );

          for await (const element of fetchResponse) {
            if (signal?.aborted) break;
            pushRunningChatHistory({ chat: updatedChat, model, message: element });
          }

          // 4. 流式完成：获取 runningChat 数据并回写
          const runningEntry = runningChat.value[chatId]?.[model.id];
          if (runningEntry?.history) {
            updateHistoryContent({
              chatId,
              modelId: model.id,
              messageIndex: userMessageIndex + 1,
              content: runningEntry.history.content
                ? getCurrentContent(runningEntry.history.content)
                : '',
              reasoningContent: runningEntry.history.reasoningContent
                ? getCurrentContent(runningEntry.history.reasoningContent)
                : undefined,
            });
          }
        })();
      }));

      // fulfilled：持久化（原 middleware 监听 editAndResendMessage.fulfilled）
      await persistChatFromActive(chatId);
    } catch (err) {
      // rejected（回滚）
      console.error('[editAndResendMessage] failed, rolling back:', {
        chatId, userMessageId, error: err,
      });
      rollbackEdit({ chatId, userMessageId });
      throw err;
    } finally {
      delete sendingChatIds.value[chatId];
    }
  }

  /**
   * 重新生成最后一条 AI 回复
   */
  async function regenerateMessage(
    args: {
      chatId: string;
      assistantMessageId: string;
      historyIndex?: number;
    },
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const { chatId, assistantMessageId, historyIndex } = args
    const signal = options?.signal

    // pending
    sendingChatIds.value[chatId] = true;

    try {
      const chat = activeChatData.value[chatId];
      if (!chat?.chatModelList) return;

      const modelsStore = useModelsStore();
      const models = modelsStore.models;

      // 通过位置索引获取 assistantMessageIndex
      const assistantMessageIndex = findMessageIndex(chatStateLike(), chatId, assistantMessageId);
      if (assistantMessageIndex === -1) return;

      // 1. 先为每个启用模型初始化 runningChat 条目
      for (const chatModel of chat.chatModelList) {
        const model = models.find(m => m.id === chatModel.modelId);
        if (isNil(model) || model.isDeleted || !model.isEnable) continue;
        editRegenerateInit({ chatId, modelId: model.id });
      }

      // 2. 提交重新生成（此时 runningChat 条目已存在，可写入回滚字段）
      commitRegenerate({ chatId, assistantMessageId, historyIndex });

      const appConfigStore = useAppConfigStore();

      // 3. 对每个启用模型裁剪历史并调用流式生成
      await Promise.all(chat.chatModelList.map((chatModel) => {
        const model = models.find(m => m.id === chatModel.modelId);
        if (isNil(model) || model.isDeleted || !model.isEnable) return;

        // 裁剪历史：不包含用户消息和旧 AI 回复（用户消息通过 message 参数追加）
        const trimmedHistory = chatModel.chatHistoryList.slice(0, assistantMessageIndex - 1);
        const transmitHistoryReasoning = appConfigStore.transmitHistoryReasoning;

        return (async () => {
          // 按 historyIndex 提取用户消息内容作为 API prompt
          const userMessageContent = chatModel.chatHistoryList[assistantMessageIndex - 1]?.content || '';
          const promptMessage = historyIndex !== undefined
            ? getContentAtIndex(userMessageContent, historyIndex)
            : getCurrentContent(userMessageContent);

          const fetchResponse = streamChatCompletion(
            {
              model,
              historyList: trimmedHistory,
              message: promptMessage,
              transmitHistoryReasoning,
            },
            { signal },
          );

          for await (const element of fetchResponse) {
            if (signal?.aborted) break;
            pushRunningChatHistory({ chat, model, message: element });
          }

          // 4. 流式完成：获取 runningChat 数据并回写
          const runningEntry = runningChat.value[chatId]?.[model.id];
          if (runningEntry?.history) {
            updateHistoryContent({
              chatId,
              modelId: model.id,
              messageIndex: assistantMessageIndex,
              content: runningEntry.history.content
                ? getCurrentContent(runningEntry.history.content)
                : '',
              reasoningContent: runningEntry.history.reasoningContent
                ? getCurrentContent(runningEntry.history.reasoningContent)
                : undefined,
              historyIndex,
            });
          }
        })();
      }));

      // fulfilled：持久化（原 middleware 监听 regenerateMessage.fulfilled）
      await persistChatFromActive(chatId);
    } catch (err) {
      // rejected（回滚，传递 historyIndex 防止回滚写入错误索引）
      rollbackRegenerate({ chatId, assistantMessageId, historyIndex });
      throw err;
    } finally {
      delete sendingChatIds.value[chatId];
    }
  }

  return {
    // state
    chatMetaList,
    activeChatData,
    sendingChatIds,
    loading,
    selectedChatId,
    error,
    initializationError,
    runningChat,
    // actions
    resetChatStore,
    setChatMetaList,
    setSelectedChatId,
    clearError,
    clearInitializationError,
    createChat,
    editChat,
    editChatName,
    deleteChat,
    setActiveChatData,
    clearActiveChatData,
    releaseCompletedBackgroundChat,
    pushRunningChatHistory,
    pushChatHistory,
    commitEdit,
    rollbackEdit,
    commitRegenerate,
    rollbackRegenerate,
    updateHistoryContent,
    editRegenerateInit,
    initializeChatList,
    sendMessage,
    generateChatName,
    setSelectedChatIdWithPreload,
    startSendChatMessage,
    editAndResendMessage,
    regenerateMessage,
  };
});

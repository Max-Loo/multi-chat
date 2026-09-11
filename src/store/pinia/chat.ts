import { ref } from 'vue';
import { defineStore } from 'pinia';
import { isNil, isNotNil } from 'es-toolkit';
import { createIdGenerator } from 'ai';
import { Chat, ChatMeta, ChatRoleEnum, RunningChatEntry, StandardMessage, chatToMeta } from '@/types/chat';
import { Model } from '@/types/model';
import { loadChatIndex, loadChatById, saveChatAndIndex, deleteChatFromStorage } from '../storage';
import { streamChatCompletion, generateChatTitleService } from '@/services/chat';
import { getProviderSDKLoader } from '@/services/chat/providerLoader';
import { useAppConfigStore } from './appConfig';
import { useModelStore } from './model';
import { USER_MESSAGE_ID_PREFIX } from '@/utils/constants';
import { getCurrentTimestamp } from '@/utils/utils';
import { ModelProviderKeyEnum } from '@/utils/enums';
import {
  commitEdit as commitEditHelper,
  rollbackEdit as rollbackEditHelper,
  commitRegenerate as commitRegenerateHelper,
  rollbackRegenerate as rollbackRegenerateHelper,
  updateHistoryContent as updateHistoryContentHelper,
  findMessageIndex,
  getCurrentContent,
  getContentAtIndex,
} from '@/services/chat/chatHistoryHelper';
import type { ChatSliceState } from '@/store/slices/chatSlices';

// 生成用户消息 ID 的工具函数（带前缀）
const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX });

/**
 * 聊天状态 Store（Pinia 版）
 *
 * 状态、动作与编排逻辑与迁移前 Redux chat slice + chatMiddleware 一致：
 * - 聊天元数据列表与按需加载的完整数据
 * - 流式发送、编辑重发、重新生成
 * - 自动命名（含防竞态锁）与数据持久化（原 listener middleware 下沉到 action 内）
 */
export const useChatStore = defineStore('chat', () => {
  // ==== State ====
  /** 聊天元数据列表（从 chat_index 加载，过滤掉 isDeleted） */
  const chatMetaList = ref<ChatMeta[]>([]);
  /** 按需加载的完整聊天数据，key 是 chatId */
  const activeChatData = ref<Record<string, Chat>>({});
  /** 正在发送消息的聊天 ID 集合，防止发送中被释放 */
  const sendingChatIds = ref<Record<string, boolean>>({});
  /** 加载状态 */
  const loading = ref(false);
  /** 当前选中的要展示的聊天的Id */
  const selectedChatId = ref<string | null>(null);
  /** 操作错误信息 */
  const error = ref<string | null>(null);
  /** 初始化错误信息 */
  const initializationError = ref<string | null>(null);
  /** 当前正在运行中的聊天（还有网络传输）。chatId - modelId - history */
  const runningChat = ref<Record<string, Record<string, RunningChatEntry>>>({});

  // 用于防止多模型并发时重复生成标题的内存锁（原 chatMiddleware 内存锁）
  const generatingTitleChatIds = new Set<string>();

  // ==== 内部工具 ====

  /**
   * 构造 chatHistoryHelper 需要的状态适配对象
   * helper 只读写 activeChatData，传入响应式对象的 .value 即可直接变更
   */
  const helperState = (): ChatSliceState =>
    ({ activeChatData: activeChatData.value, chatMetaList: chatMetaList.value }) as unknown as ChatSliceState;

  /**
   * 在 activeChatData 中定位指定聊天的模型，将消息追加到其历史记录中
   * @returns 追加成功返回 true，聊天/模型不存在或消息为 null 时返回 false
   */
  const appendHistoryToModel = (
    chatId: string,
    modelId: string,
    message: StandardMessage | null,
  ): boolean => {
    if (isNil(message)) return false;

    const chat = activeChatData.value[chatId];
    if (!chat) {
      console.error(`appendHistoryToModel: activeChatData[${chatId}] 不存在`);
      return false;
    }

    const chatModelList = chat.chatModelList;
    if (!chatModelList) return false;

    const modelIdx = chatModelList.findIndex((item) => item.modelId === modelId);
    if (modelIdx === -1) return false;

    if (!Array.isArray(chatModelList[modelIdx].chatHistoryList)) {
      chatModelList[modelIdx].chatHistoryList = [];
    }
    chatModelList[modelIdx].chatHistoryList.push(message);
    return true;
  };

  /** 更新 chatMetaList 中指定聊天的元数据 */
  const updateMetaInList = (chatId: string, update: Partial<ChatMeta>): void => {
    const metaIdx = chatMetaList.value.findIndex((m) => m.id === chatId);
    if (metaIdx !== -1) {
      chatMetaList.value[metaIdx] = { ...chatMetaList.value[metaIdx], ...update };
    }
  };

  /** 初始化/获取 runningChat 中指定聊天与模型的条目（原 pending/matcher 逻辑） */
  const ensureRunningEntry = (chatId: string, modelId: string): RunningChatEntry => {
    if (isNil(runningChat.value[chatId])) {
      runningChat.value[chatId] = {};
    }
    if (isNil(runningChat.value[chatId][modelId])) {
      runningChat.value[chatId][modelId] = {
        isSending: true,
        history: null,
        errorMessage: '',
      };
    } else {
      runningChat.value[chatId][modelId].isSending = true;
      runningChat.value[chatId][modelId].errorMessage = '';
    }
    return runningChat.value[chatId][modelId];
  };

  /** 编辑/重新生成时初始化 runningChat 结构（原 editRegenerateInit matcher） */
  const editRegenerateInit = (chatId: string, modelId: string): void => {
    if (isNil(runningChat.value[chatId])) {
      runningChat.value[chatId] = {};
    }
    if (isNil(runningChat.value[chatId][modelId])) {
      runningChat.value[chatId][modelId] = {
        isSending: true,
        history: null,
      };
    }
  };

  // ==== 同步 Actions ====

  /** 设置当前的聊天元数据列表 */
  const setChatMetaList = (list: ChatMeta[]) => {
    chatMetaList.value = [...list];
  };

  /** 设置当前选中的聊天ID */
  const setSelectedChatId = (id: string | null) => {
    selectedChatId.value = id;
  };

  /** 清除操作错误信息 */
  const clearError = () => {
    error.value = null;
  };

  /** 清除初始化错误信息 */
  const clearInitializationError = () => {
    initializationError.value = null;
  };

  /** 新增聊天（同时持久化，原 middleware 逻辑下沉） */
  const createChat = async ({ chat }: { chat: Chat }) => {
    // 初始化 updatedAt
    if (chat.updatedAt === undefined) {
      chat.updatedAt = getCurrentTimestamp();
    }
    // 同时更新 chatMetaList 和 activeChatData
    chatMetaList.value.unshift(chatToMeta(chat));
    activeChatData.value[chat.id] = chat;

    // 持久化（原 saveChatListMiddleware）
    const index = await loadChatIndex();
    await saveChatAndIndex(chat.id, chat, index);
  };

  /** 编辑聊天（同时持久化） */
  const editChat = async ({ chat }: { chat: Chat }) => {
    // 更新 updatedAt
    chat.updatedAt = getCurrentTimestamp();

    // 更新 activeChatData
    activeChatData.value[chat.id] = { ...chat };

    // 更新 chatMetaList
    updateMetaInList(chat.id, chatToMeta(chat));

    // 持久化
    const index = await loadChatIndex();
    await saveChatAndIndex(chat.id, chat, index);
  };

  /**
   * 编辑聊天的名称（同时持久化）
   * 验证：不允许空标题（静默拒绝）；超长标题静默截断到 20 个字符
   */
  const editChatName = async ({ id, name }: { name: string; id: string }) => {
    if (!name || name.trim() === '') {
      return; // 静默拒绝，不更新状态
    }

    const trimmedName = name.length > 20 ? name.slice(0, 20) : name;
    const now = getCurrentTimestamp();

    // 更新 chatMetaList
    const metaIdx = chatMetaList.value.findIndex((m) => m.id === id);
    if (metaIdx !== -1) {
      chatMetaList.value[metaIdx].name = trimmedName;
      chatMetaList.value[metaIdx].isManuallyNamed = true;
      chatMetaList.value[metaIdx].updatedAt = now;
    }

    // 更新 activeChatData（若已加载）
    const activeChat = activeChatData.value[id];
    if (activeChat) {
      activeChat.name = trimmedName;
      activeChat.isManuallyNamed = true;
      activeChat.updatedAt = now;
    }

    // 持久化：聊天未加载到 activeChatData 时，从存储读取后应用重命名（原 middleware 逻辑）
    const index = await loadChatIndex();
    let chatData = activeChatData.value[id];
    if (!chatData) {
      const stored = await loadChatById(id);
      if (stored) {
        stored.name = trimmedName;
        stored.isManuallyNamed = true;
        stored.updatedAt = chatMetaList.value.find((m) => m.id === id)?.updatedAt;
        chatData = stored;
        await saveChatAndIndex(id, chatData, index);
      }
    } else {
      await saveChatAndIndex(id, chatData, index);
    }
  };

  /**
   * 删除聊天（同时从存储删除并清理 URL 参数，原 middleware 逻辑下沉）
   * 检查是否正在发送，若正在发送则跳过
   */
  const deleteChat = async ({ chat }: { chat: Chat }) => {
    if (sendingChatIds.value[chat.id]) {
      return;
    }

    // 从 chatMetaList 彻底移除（非软标记）
    chatMetaList.value = chatMetaList.value.filter((m) => m.id !== chat.id);

    // 从 activeChatData 中移除
    delete activeChatData.value[chat.id];

    // 判断「是否当前选中的聊天正好是需要被删除的」
    if (selectedChatId.value === chat.id) {
      selectedChatId.value = null;
    }

    // 从存储删除（deleteChatFromStorage 会从存储加载完整数据再标记 isDeleted）
    const index = await loadChatIndex();
    await deleteChatFromStorage(chat.id, index);

    // 防御性兜底：如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
    if (selectedChatId.value === chat.id) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('chatId')) {
        url.searchParams.delete('chatId');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  };

  /** 设置当前活跃聊天数据 */
  const setActiveChatData = ({ chatId, chat }: { chatId: string; chat: Chat }) => {
    activeChatData.value[chatId] = chat;
  };

  /** 清理指定聊天的活跃数据（跳过正在发送的聊天） */
  const clearActiveChatData = (chatId: string) => {
    if (sendingChatIds.value[chatId]) {
      return;
    }
    delete activeChatData.value[chatId];
  };

  /** 发送结束后回收非当前选中聊天的 activeChatData */
  const releaseCompletedBackgroundChat = (chatId: string) => {
    if (selectedChatId.value !== chatId) {
      delete activeChatData.value[chatId];
    }
  };

  /** 向当前聊天的运行记录添加内容 */
  const pushRunningChatHistory = ({ chat, model, message }: {
    chat: Chat;
    model: Model;
    message: StandardMessage;
  }) => {
    runningChat.value[chat.id][model.id].history = message;
  };

  /** 向聊天历史记录添加内容 */
  const pushChatHistory = ({ chat, model, message }: {
    chat: Chat;
    model: Model;
    message: StandardMessage;
  }) => {
    appendHistoryToModel(chat.id, model.id, message);
  };

  /** 提交编辑：原子更新用户消息和 AI 回复的 content 数组 */
  const commitEdit = ({ chatId, userMessageId, newContent }: {
    chatId: string;
    userMessageId: string;
    newContent: string;
  }) => {
    commitEditHelper(helperState(), chatId, userMessageId, newContent);
  };

  /** 回滚编辑：恢复用户消息和 AI 回复到编辑前的状态 */
  const rollbackEdit = ({ chatId, userMessageId }: { chatId: string; userMessageId: string }) => {
    rollbackEditHelper(helperState(), chatId, userMessageId);
  };

  /** 提交重新生成：将旧 AI 回复 push 进数组，追加空字符串占位 */
  const commitRegenerate = ({ chatId, assistantMessageId, historyIndex }: {
    chatId: string;
    assistantMessageId: string;
    historyIndex?: number;
  }) => {
    commitRegenerateHelper(helperState(), chatId, assistantMessageId, historyIndex);
  };

  /** 回滚重新生成：弹出 AI 回复数组中的占位元素 */
  const rollbackRegenerate = ({ chatId, assistantMessageId, historyIndex }: {
    chatId: string;
    assistantMessageId: string;
    historyIndex?: number;
  }) => {
    rollbackRegenerateHelper(helperState(), chatId, assistantMessageId, historyIndex);
  };

  /** 流式完成后更新 AI 回复的 content/reasoningContent 数组目标元素 */
  const updateHistoryContent = ({ chatId, modelId, messageIndex, content, reasoningContent, historyIndex }: {
    chatId: string;
    modelId: string;
    messageIndex: number;
    content: string;
    reasoningContent?: string;
    historyIndex?: number;
  }) => {
    updateHistoryContentHelper(helperState(), chatId, modelId, messageIndex, content, reasoningContent, historyIndex);
  };

  // ==== 异步 Actions ====

  /**
   * 初始化聊天列表，加载索引元数据（过滤已删除聊天）
   */
  const initializeChatList = async (): Promise<void> => {
    loading.value = true;
    initializationError.value = null;
    try {
      const index: ChatMeta[] = await loadChatIndex();
      chatMetaList.value = index.filter((meta) => !meta.isDeleted);
      loading.value = false;
    } catch (err) {
      loading.value = false;
      initializationError.value = err instanceof Error ? err.message : 'Failed to initialize file';
    }
  };

  /**
   * 针对某个聊天的每个模型来发送消息
   * 流式响应逐段写入 runningChat，完成后回写到 activeChatData
   */
  const sendMessage = async ({ chat, message, model, historyList }: {
    chat: Chat;
    message: string;
    model: Model;
    historyList: StandardMessage[];
  }, options?: { signal?: AbortSignal }): Promise<void> => {
    const signal = options?.signal ?? new AbortController().signal;

    // pending：结构初始化
    ensureRunningEntry(chat.id, model.id);

    try {
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
      });

      // 获取是否传输推理内容的开关状态
      const appConfigStore = useAppConfigStore();
      const transmitHistoryReasoning = appConfigStore.transmitHistoryReasoning;

      // 使用 ChatService 发起流式聊天请求
      const fetchResponse = streamChatCompletion(
        {
          model,
          historyList,
          message,
          transmitHistoryReasoning,
        },
        { signal },
      );

      // 以流式响应处理，但每次的 element 都是最新完整内容，并非增量
      for await (const element of fetchResponse) {
        if (signal.aborted) {
          break;
        }
        // 将每条记录放进运行中的记录，以便展示
        pushRunningChatHistory({ chat, model, message: element });
      }

      // fulfilled：回写临时数据到 activeChatData
      const currentChatModel = runningChat.value[chat.id][model.id];
      currentChatModel.isSending = false;

      // 将临时的数据回写到 activeChatData 中，追加失败时跳过清理
      if (!appendHistoryToModel(chat.id, model.id, currentChatModel.history)) return;

      // 更新 updatedAt
      const activeChat = activeChatData.value[chat.id];
      if (activeChat) {
        activeChat.updatedAt = getCurrentTimestamp();
        updateMetaInList(chat.id, { updatedAt: activeChat.updatedAt });
      }

      // 清理临时数据
      delete runningChat.value[chat.id][model.id];

      // 完成后检测自动命名（原 chatMiddleware 监听 sendMessage.fulfilled，异步不阻塞）
      void maybeAutoGenerateTitle(chat.id, model);
    } catch (err) {
      // rejected：取消发送状态，记录错误信息
      const errorObj = err as Error;
      const errorMessage = errorObj?.message ?? '';
      const errorStack = errorObj?.stack ?? '';
      const currentChatModel = runningChat.value[chat.id]?.[model.id];
      if (currentChatModel) {
        currentChatModel.isSending = false;
        currentChatModel.errorMessage = errorMessage + errorStack;
      }

      console.error('❌ 聊天消息发送失败:', {
        chatId: chat.id,
        chatName: chat.name,
        modelId: model.id,
        modelName: model.modelName,
        modelKey: model.modelKey,
        errorName: errorObj?.name,
        errorMessage: errorObj?.message,
        errorStack: errorObj?.stack,
      });

      throw err;
    }
  };

  /**
   * 切换聊天并预加载供应商 SDK + 加载完整数据
   */
  const setSelectedChatIdWithPreload = async (chatId: string | null): Promise<void> => {
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
    if (chatModelList.length === 0) {
      applySelectedChat(chatId, chatData);
      return;
    }

    try {
      const providerSDKLoader = getProviderSDKLoader();
      const modelStore = useModelStore();

      // 提取聊天使用的所有 providerKey
      const providerKeys = new Set<ModelProviderKeyEnum>();
      for (const chatModel of chatModelList) {
        const model = modelStore.models.find((m) => m.id === chatModel.modelId);
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

    applySelectedChat(chatId, chatData);
  };

  /** 应用选中聊天切换并清理上一个聊天的数据（原 fulfilled 逻辑） */
  const applySelectedChat = (chatId: string | null, chatData?: Chat) => {
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
  };

  /**
   * 生成聊天标题（静默失败）
   */
  const generateChatName = async ({ chat, model, historyList }: {
    chat: Chat;
    model: Model;
    historyList: StandardMessage[];
  }): Promise<{ chatId: string; name: string } | null> => {
    try {
      // 检查全局开关状态
      const appConfigStore = useAppConfigStore();
      if (!appConfigStore.autoNamingEnabled) {
        return null;
      }

      // 调用标题生成服务
      const title = await generateChatTitleService(historyList, model);

      return {
        chatId: chat.id,
        name: title,
      };
    } catch (err) {
      // 静默处理错误，记录警告日志
      console.warn('Failed to generate chat title:', err);
      return null;
    }
  };

  /**
   * 自动标题生成检测（原 chatMiddleware 逻辑下沉）
   * 在 sendMessage 完成后调用，满足全部条件时触发标题生成
   */
  const maybeAutoGenerateTitle = async (chatId: string, model: Model): Promise<void> => {
    // 检查是否正在生成标题（防止竞态条件）
    if (generatingTitleChatIds.has(chatId)) {
      return;
    }

    // 从 activeChatData 获取聊天数据
    const currentChat = activeChatData.value[chatId];
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
    const chatModel = currentChat.chatModelList?.find((cm) => cm.modelId === model.id);
    if (!chatModel || chatModel.chatHistoryList.length !== 2) {
      return;
    }

    // 所有条件满足，触发标题生成
    generatingTitleChatIds.add(chatId);
    try {
      const result = await generateChatName({
        chat: currentChat,
        model,
        historyList: chatModel.chatHistoryList,
      });

      // 生成成功：更新 meta 与 activeChatData 并持久化（原 fulfilled reducer + middleware）
      if (result !== null) {
        const now = getCurrentTimestamp();
        updateMetaInList(chatId, { name: result.name, updatedAt: now });

        const activeChat = activeChatData.value[chatId];
        if (activeChat) {
          activeChat.name = result.name;
          activeChat.updatedAt = now;
        }

        const index = await loadChatIndex();
        const chatData = activeChatData.value[chatId];
        if (chatData) {
          await saveChatAndIndex(chatId, chatData, index);
        }
      }
    } finally {
      generatingTitleChatIds.delete(chatId);
    }
  };

  /**
   * 触发发送聊天消息
   * 并行向聊天启用的每个模型发送，结束后回写剩余数据并持久化
   */
  const startSendChatMessage = async ({ chat, message }: {
    chat: Chat;
    message: string;
  }, options?: { signal?: AbortSignal }): Promise<void> => {
    const signal = options?.signal ?? new AbortController().signal;

    // pending：将 chatId 加入 sendingChatIds
    sendingChatIds.value[chat.id] = true;

    try {
      const modelStore = useModelStore();
      const { models } = modelStore;
      const { chatModelList = [] } = chat;

      await Promise.all(
        chatModelList.map((chatModel) => {
          const model = models.find((m) => m.id === chatModel.modelId);
          // 只有当模型没有被删除，且已经启用的时候，才会进行发送
          if (isNotNil(model) && !model.isDeleted && model.isEnable) {
            return sendMessage(
              {
                chat,
                message,
                model,
                historyList: chatModel.chatHistoryList,
              },
              {
                // 传递令牌，使得能够中断
                signal,
              },
            ).catch(() => {
              // 单模型失败已在 sendMessage 内记录，不中断其他模型
            });
          }
          return undefined;
        }),
      );
    } finally {
      // fulfilled/rejected 共同路径：回写剩余 runningChat 数据到 activeChatData
      const currentChat = runningChat.value[chat.id];
      if (isNotNil(currentChat)) {
        Object.entries(currentChat).forEach(([modelId, historyItem]) => {
          appendHistoryToModel(chat.id, modelId, historyItem.history);
        });
      }

      // 将 chatId 从 sendingChatIds 移除
      delete sendingChatIds.value[chat.id];

      // 持久化（原 middleware 监听 fulfilled/rejected 触发）
      const index = await loadChatIndex();
      const chatData = activeChatData.value[chat.id];
      if (chatData) {
        await saveChatAndIndex(chat.id, chatData, index);
      }

      // 发送结束后，回收非当前选中聊天的 activeChatData
      if (selectedChatId.value !== chat.id) {
        releaseCompletedBackgroundChat(chat.id);
      }
    }
  };

  /**
   * 编辑最新用户消息并重新生成 AI 回复
   */
  const editAndResendMessage = async ({ chatId, userMessageId, newContent }: {
    chatId: string;
    userMessageId: string;
    newContent: string;
  }, options?: { signal?: AbortSignal }): Promise<void> => {
    const signal = options?.signal ?? new AbortController().signal;
    const chat = activeChatData.value[chatId];
    if (!chat?.chatModelList) return;

    sendingChatIds.value[chatId] = true;

    try {
      // 1. 提交编辑（原子更新数组）
      commitEdit({ chatId, userMessageId, newContent });

      // 2. 重新获取最新状态（commitEdit 已更新 chatHistoryList）
      const updatedChat = activeChatData.value[chatId];
      if (!updatedChat?.chatModelList) return;

      const modelStore = useModelStore();
      const models = modelStore.models;

      // 通过位置索引获取 userMessageIndex
      const userMessageIndex = findMessageIndex(helperState(), chatId, userMessageId);
      if (userMessageIndex === -1) return;

      const appConfigStore = useAppConfigStore();

      // 3. 对每个启用模型裁剪历史并调用流式生成
      await Promise.all(updatedChat.chatModelList.map((chatModel) => {
        const model = models.find((m) => m.id === chatModel.modelId);
        if (isNil(model) || model.isDeleted || !model.isEnable) return;

        // 裁剪历史：不包含编辑的用户消息和旧 AI 回复（用户消息通过 message 参数追加）
        const trimmedHistory = chatModel.chatHistoryList.slice(0, userMessageIndex);
        const transmitHistoryReasoning = appConfigStore.transmitHistoryReasoning;

        return (async () => {
          // 初始化 runningChat 结构
          editRegenerateInit(chatId, model.id);

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
            if (signal.aborted) break;
            pushRunningChatHistory({ chat: updatedChat, model, message: element });
          }

          // 4. 流式完成：获取最新状态中的 runningChat 数据
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

      // fulfilled：持久化
      const index = await loadChatIndex();
      const chatData = activeChatData.value[chatId];
      if (chatData) {
        await saveChatAndIndex(chatId, chatData, index);
      }
    } catch (err) {
      // rejected：回滚
      console.error('[editAndResendMessage] failed, rolling back:', { chatId, userMessageId, error: err });
      rollbackEdit({ chatId, userMessageId });
      throw err;
    } finally {
      delete sendingChatIds.value[chatId];
    }
  };

  /**
   * 重新生成最后一条 AI 回复
   */
  const regenerateMessage = async ({ chatId, assistantMessageId, historyIndex }: {
    chatId: string;
    assistantMessageId: string;
    historyIndex?: number;
  }, options?: { signal?: AbortSignal }): Promise<void> => {
    const signal = options?.signal ?? new AbortController().signal;
    const chat = activeChatData.value[chatId];
    if (!chat?.chatModelList) return;

    const modelStore = useModelStore();
    const models = modelStore.models;

    // 通过位置索引获取 assistantMessageIndex
    const assistantMessageIndex = findMessageIndex(helperState(), chatId, assistantMessageId);
    if (assistantMessageIndex === -1) return;

    sendingChatIds.value[chatId] = true;

    try {
      // 1. 先为每个启用模型初始化 runningChat 条目
      for (const chatModel of chat.chatModelList) {
        const model = models.find((m) => m.id === chatModel.modelId);
        if (isNil(model) || model.isDeleted || !model.isEnable) continue;
        editRegenerateInit(chatId, model.id);
      }

      // 2. 提交重新生成（此时 runningChat 条目已存在，可写入回滚字段）
      commitRegenerate({ chatId, assistantMessageId, historyIndex });

      const appConfigStore = useAppConfigStore();

      // 3. 对每个启用模型裁剪历史并调用流式生成
      await Promise.all(chat.chatModelList.map((chatModel) => {
        const model = models.find((m) => m.id === chatModel.modelId);
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
            if (signal.aborted) break;
            pushRunningChatHistory({ chat, model, message: element });
          }

          // 4. 流式完成
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

      // fulfilled：持久化
      const index = await loadChatIndex();
      const chatData = activeChatData.value[chatId];
      if (chatData) {
        await saveChatAndIndex(chatId, chatData, index);
      }
    } catch (err) {
      // rejected：回滚重新生成（传递 historyIndex 防止回滚写入错误索引）
      rollbackRegenerate({ chatId, assistantMessageId, historyIndex });
      throw err;
    } finally {
      delete sendingChatIds.value[chatId];
    }
  };

  return {
    // state
    chatMetaList,
    activeChatData,
    sendingChatIds,
    loading,
    error,
    selectedChatId,
    initializationError,
    runningChat,
    // sync actions
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
    // async actions
    initializeChatList,
    sendMessage,
    startSendChatMessage,
    generateChatName,
    setSelectedChatIdWithPreload,
    editAndResendMessage,
    regenerateMessage,
  };
});

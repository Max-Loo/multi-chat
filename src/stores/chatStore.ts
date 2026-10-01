/**
 * 聊天状态管理（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/chatSlices.ts
 * 状态形状与 action 语义保持一致：
 * - 同步 action：同名同义（createChat/editChat/editChatName/deleteChat/...）
 * - 异步 action：对应 createAsyncThunk，pending/fulfilled/rejected 语义收敛进
 *   action 内部的 try/catch/finally
 * - 持久化与自动命名副作用由 plugins/chatPlugin.ts 承载
 */
import { defineStore } from 'pinia';
import { isNil, isNotNil } from 'es-toolkit';
import { createIdGenerator } from 'ai';
import { chatToMeta, ChatRoleEnum } from '@/types/chat';
import type { Chat, ChatMeta, RunningChatEntry, StandardMessage } from '@/types/chat';
import type { Model } from '@/types/model';
import { loadChatIndex, loadChatById } from '@/store/storage';
import { streamChatCompletion, generateChatTitleService } from '@/services/chat';
import { getProviderSDKLoader } from '@/services/chat/providerLoader';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { USER_MESSAGE_ID_PREFIX } from '@/utils/constants';
import { getCurrentTimestamp } from '@/utils/utils';
import { useAppConfigStore } from './appConfigStore';
import { useModelStore } from './modelStore';
import type { ChatSliceState } from '@/store/slices/chatSlices';
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

// 生成用户消息 ID 的工具函数（带前缀）
const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX });

/**
 * 在 activeChatData 中定位指定聊天的模型，将消息追加到其历史记录中
 * @param state 聊天状态（响应式代理）
 * @param chatId 目标聊天 ID
 * @param modelId 目标模型 ID
 * @param message 要追加的消息，为 null 时静默跳过
 * @returns 追加成功返回 true，聊天/模型不存在或消息为 null 时返回 false
 */
function appendHistoryToModel(
  state: ChatSliceState,
  chatId: string,
  modelId: string,
  message: StandardMessage | null,
): boolean {
  if (isNil(message)) return false;

  const chat = state.activeChatData[chatId];
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
}

/**
 * 更新 chatMetaList 中指定聊天的元数据
 */
function updateMetaInList(
  state: ChatSliceState,
  chatId: string,
  update: Partial<ChatMeta>,
): void {
  const metaIdx = state.chatMetaList.findIndex((m) => m.id === chatId);
  if (metaIdx !== -1) {
    state.chatMetaList[metaIdx] = { ...state.chatMetaList[metaIdx], ...update };
  }
}

/**
 * 初始化指定聊天/模型的 runningChat 结构（幂等）
 */
function ensureRunningEntry(
  state: ChatSliceState,
  chatId: string,
  modelId: string,
): RunningChatEntry {
  if (isNil(state.runningChat[chatId])) {
    state.runningChat[chatId] = {};
  }
  if (isNil(state.runningChat[chatId][modelId])) {
    state.runningChat[chatId][modelId] = {
      isSending: true,
      history: null,
      errorMessage: '',
    };
  }
  return state.runningChat[chatId][modelId];
}

/** sendMessage 的参数 */
export interface SendMessageArgs {
  chat: Chat;
  message: string;
  model: Model;
  historyList: StandardMessage[];
}

export const useChatStore = defineStore('chat', {
  state: (): ChatSliceState => ({
    chatMetaList: [],
    activeChatData: {},
    sendingChatIds: {},
    loading: false,
    error: null,
    selectedChatId: null,
    initializationError: null,
    runningChat: {},
  }),
  actions: {
    // ==================== 同步 action ====================

    /** 设置当前的聊天元数据列表 */
    setChatMetaList(list: ChatMeta[]) {
      this.chatMetaList = [...list];
    },
    /** 设置当前选中的聊天 ID */
    setSelectedChatId(chatId: string | null) {
      this.selectedChatId = chatId;
    },
    /** 清除操作错误信息 */
    clearError() {
      this.error = null;
    },
    /** 清除初始化错误信息 */
    clearInitializationError() {
      this.initializationError = null;
    },
    /** 新增聊天 */
    createChat(chat: Chat) {
      // 初始化 updatedAt
      if (chat.updatedAt === undefined) {
        chat.updatedAt = getCurrentTimestamp();
      }
      // 同时更新 chatMetaList 和 activeChatData
      this.chatMetaList.unshift(chatToMeta(chat));
      this.activeChatData[chat.id] = chat;
    },
    /** 编辑聊天 */
    editChat(chat: Chat) {
      // 更新 updatedAt
      chat.updatedAt = getCurrentTimestamp();

      // 更新 activeChatData
      this.activeChatData[chat.id] = { ...chat };

      // 更新 chatMetaList
      updateMetaInList(this.$state, chat.id, chatToMeta(chat));
    },
    /** 编辑聊天的名称 */
    editChatName(id: string, name: string) {
      // 验证：不允许空标题（包括空字符串和仅空白字符）
      if (!name || name.trim() === '') {
        return; // 静默拒绝，不更新状态
      }

      // 超长标题静默截断到 20 个字符
      const trimmedName = name.length > 20 ? name.slice(0, 20) : name;

      const now = getCurrentTimestamp();

      // 更新 chatMetaList
      const metaIdx = this.chatMetaList.findIndex((m) => m.id === id);
      if (metaIdx !== -1) {
        this.chatMetaList[metaIdx].name = trimmedName;
        this.chatMetaList[metaIdx].isManuallyNamed = true;
        this.chatMetaList[metaIdx].updatedAt = now;
      }

      // 更新 activeChatData（若已加载）
      const activeChat = this.activeChatData[id];
      if (activeChat) {
        activeChat.name = trimmedName;
        activeChat.isManuallyNamed = true;
        activeChat.updatedAt = now;
      }
    },
    /** 删除聊天 */
    deleteChat(chat: Chat) {
      // 检查是否正在发送，若正在发送则跳过
      if (this.sendingChatIds[chat.id]) {
        return;
      }

      // 从 chatMetaList 彻底移除（非软标记）
      this.chatMetaList = this.chatMetaList.filter((m) => m.id !== chat.id);

      // 从 activeChatData 中移除
      delete this.activeChatData[chat.id];

      // 判断「是否当前选中的聊天正好是需要被删除的」
      if (this.selectedChatId === chat.id) {
        this.selectedChatId = null;
      }
    },
    /** 设置当前活跃聊天数据 */
    setActiveChatData(chatId: string, chat: Chat) {
      this.activeChatData[chatId] = chat;
    },
    /** 清理指定聊天的活跃数据（跳过正在发送的聊天） */
    clearActiveChatData(chatId: string) {
      // 跳过正在发送的聊天
      if (this.sendingChatIds[chatId]) {
        return;
      }
      delete this.activeChatData[chatId];
    },
    /** 发送结束后回收非当前选中聊天的 activeChatData */
    releaseCompletedBackgroundChat(chatId: string) {
      if (this.selectedChatId !== chatId) {
        delete this.activeChatData[chatId];
      }
    },
    /** 向运行中的聊天记录添加内容 */
    pushRunningChatHistory(chat: Chat, model: Model, message: StandardMessage) {
      this.runningChat[chat.id][model.id].history = message;
    },
    /** 向聊天历史记录添加内容 */
    pushChatHistory(chat: Chat, model: Model, message: StandardMessage) {
      appendHistoryToModel(this.$state, chat.id, model.id, message);
    },
    /** 提交编辑：原子更新用户消息和 AI 回复的 content 数组 */
    commitEdit(chatId: string, userMessageId: string, newContent: string) {
      commitEditHelper(this.$state, chatId, userMessageId, newContent);
    },
    /** 回滚编辑：恢复用户消息和 AI 回复到编辑前的状态 */
    rollbackEdit(chatId: string, userMessageId: string) {
      rollbackEditHelper(this.$state, chatId, userMessageId);
    },
    /** 提交重新生成：将旧 AI 回复 push 进数组，追加空字符串占位 */
    commitRegenerate(chatId: string, assistantMessageId: string, historyIndex?: number) {
      commitRegenerateHelper(this.$state, chatId, assistantMessageId, historyIndex);
    },
    /** 回滚重新生成：弹出 AI 回复数组中的占位元素 */
    rollbackRegenerate(chatId: string, assistantMessageId: string, historyIndex?: number) {
      rollbackRegenerateHelper(this.$state, chatId, assistantMessageId, historyIndex);
    },
    /** 流式完成后更新 AI 回复的 content/reasoningContent 数组目标元素 */
    updateHistoryContent(payload: {
      chatId: string;
      modelId: string;
      messageIndex: number;
      content: string;
      reasoningContent?: string;
      historyIndex?: number;
    }) {
      updateHistoryContentHelper(
        this.$state,
        payload.chatId,
        payload.modelId,
        payload.messageIndex,
        payload.content,
        payload.reasoningContent,
        payload.historyIndex,
      );
    },
    /** 编辑/重新生成时初始化 runningChat 结构（对应 chatModel/editRegenerateInit matcher） */
    initEditRegenerateRunning(chatId: string, modelId: string) {
      const entry = ensureRunningEntry(this.$state, chatId, modelId);
      entry.isSending = true;
    },

    // ==================== 异步 action ====================

    /**
     * 初始化聊天列表，加载索引元数据（对应 initializeChatList thunk）
     * 过滤掉已删除的聊天
     */
    async initializeChatList(): Promise<void> {
      this.loading = true;
      this.initializationError = null;
      try {
        const index: ChatMeta[] = await loadChatIndex();
        // 过滤掉已删除的聊天
        this.chatMetaList = index.filter((meta) => !meta.isDeleted);
        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.initializationError =
          error instanceof Error ? error.message : 'Failed to initialize file';
        throw new Error(
          error instanceof Error ? error.message : 'Failed to initialize chat data',
          { cause: error },
        );
      }
    },

    /**
     * 针对某个聊天的每个模型来发送消息（对应 sendMessage thunk）
     *
     * 语义说明（与 Redux 版保持一致）：
     * - 先将用户消息追加到该模型的历史记录
     * - 流式期间将每个完整快照写入 runningChat
     * - 正常完成：回写 runningChat 历史到 activeChatData，更新 updatedAt，清理运行条目
     * - 出错：标记 isSending=false 并记录 errorMessage（保留运行条目，由外层 action 统一回收）
     * - 保留条目时向调用方抛出错误（外层 Promise.all 依赖该行为触发整体回收）
     *
     * @param arg 消息参数
     * @param signal 中断令牌（可选中断流式响应）
     */
    async sendMessage(arg: SendMessageArgs, signal?: AbortSignal): Promise<void> {
      const { chat, message, model, historyList } = arg;

      // pending：初始化运行条目（对应 sendMessage.pending extraReducer）
      const entry = ensureRunningEntry(this.$state, chat.id, model.id);
      entry.isSending = true;
      entry.errorMessage = '';

      // 先将当前要发送的内容记录进历史记录
      this.pushChatHistory(chat, model, {
        id: generateUserMessageId(),
        role: ChatRoleEnum.USER,
        content: message,
        timestamp: getCurrentTimestamp(),
        modelKey: model.modelKey,
        finishReason: null,
      });

      // 获取是否传输推理内容的开关状态
      const appConfig = useAppConfigStore();

      try {
        // 使用 ChatService 发起流式聊天请求
        const fetchResponse = streamChatCompletion(
          {
            model,
            historyList,
            message,
            transmitHistoryReasoning: appConfig.transmitHistoryReasoning,
          },
          { signal },
        );

        // 以流式响应处理，但每次的 element 都是最新完整内容，并非增量
        for await (const element of fetchResponse) {
          if (signal?.aborted) {
            break;
          }
          // 将每条记录放进运行中的记录，以便展示
          this.pushRunningChatHistory(chat, model, element);
        }

        // fulfilled：将临时数据回写到 activeChatData，追加失败时跳过清理
        const currentEntry = this.runningChat[chat.id]?.[model.id];
        if (!currentEntry) return;

        currentEntry.isSending = false;
        if (!appendHistoryToModel(this.$state, chat.id, model.id, currentEntry.history)) return;

        // 更新 updatedAt
        const activeChat = this.activeChatData[chat.id];
        if (activeChat) {
          activeChat.updatedAt = getCurrentTimestamp();
          updateMetaInList(this.$state, chat.id, { updatedAt: activeChat.updatedAt });
        }

        // 清理临时数据
        delete this.runningChat[chat.id][model.id];
      } catch (error) {
        // rejected：取消发送状态并记录错误信息（保留运行条目供外层回收）
        const currentEntry = this.runningChat[chat.id]?.[model.id];
        if (currentEntry) {
          currentEntry.isSending = false;
          currentEntry.errorMessage = `${(error as Error)?.message ?? ''}${(error as Error)?.stack ?? ''}`;
        }

        console.error('❌ 聊天消息发送失败:', {
          chatId: chat.id,
          chatName: chat.name,
          modelId: model.id,
          modelName: model.modelName,
          modelKey: model.modelKey,
          error,
        });

        throw error;
      }
    },

    /**
     * 触发发送聊天消息（对应 startSendChatMessage thunk）
     * 对聊天中所有启用且未删除的模型并发发送
     * @param arg 聊天与消息
     * @param signal 中断令牌（可选中断全部模型流）
     */
    async startSendChatMessage(
      arg: { chat: Chat; message: string },
      signal?: AbortSignal,
    ): Promise<void> {
      const { chat, message } = arg;
      const modelStore = useModelStore();

      // pending：将 chatId 加入 sendingChatIds
      this.sendingChatIds[chat.id] = true;

      const { chatModelList = [] } = chat;

      try {
        await Promise.all(
          chatModelList.map((chatModel) => {
            const model = modelStore.models.find((m) => m.id === chatModel.modelId);
            // 只有当模型没有被删除，且已经启用的时候，才会进行发送
            if (isNotNil(model) && !model.isDeleted && model.isEnable) {
              return this.sendMessage(
                {
                  chat,
                  message,
                  model,
                  historyList: chatModel.chatHistoryList,
                },
                signal,
              );
            }
            return undefined;
          }),
        );
        // fulfilled：将 chatId 从 sendingChatIds 移除
        delete this.sendingChatIds[chat.id];
      } catch (error) {
        // rejected：将 runningChat 中剩余数据回写到 activeChatData，并移除发送标记
        const currentChat = this.runningChat[chat.id];
        if (isNotNil(currentChat)) {
          Object.entries(currentChat).forEach(([modelId, historyItem]) => {
            appendHistoryToModel(this.$state, chat.id, modelId, historyItem.history);
          });
        }
        delete this.sendingChatIds[chat.id];
        throw error;
      }
    },

    /**
     * 切换聊天并预加载供应商 SDK + 加载完整数据（对应 setSelectedChatIdWithPreload thunk）
     * @param chatId 目标聊天 ID（null 表示取消选中）
     */
    async setSelectedChatIdWithPreload(chatId: string | null): Promise<void> {
      if (!chatId) {
        this.applySelectedChat(chatId, undefined);
        return;
      }

      // 从 activeChatData 中查找
      let chatData = this.activeChatData[chatId];

      // 如果未加载，从存储读取
      if (!chatData) {
        const loaded = await loadChatById(chatId);
        if (!loaded) {
          console.warn(`Chat ${chatId} not found in storage`);
          this.applySelectedChat(chatId, undefined);
          return;
        }
        chatData = loaded;
      }

      // 预加载聊天使用的供应商 SDK（优化手段，不阻塞聊天切换）
      const { chatModelList = [] } = chatData;

      // 新聊天（无模型）不预加载
      if (chatModelList.length === 0) {
        this.applySelectedChat(chatId, chatData);
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
      } catch (error) {
        // 预加载失败不影响聊天切换，仅记录警告
        console.warn('Failed to preload provider SDKs:', error);
      }

      this.applySelectedChat(chatId, chatData);
    },

    /**
     * setSelectedChatIdWithPreload 的状态落地
     * （对应 setSelectedChatIdWithPreload.fulfilled extraReducer）
     */
    applySelectedChat(chatId: string | null, chatData?: Chat) {
      const previousChatId = this.selectedChatId;

      this.selectedChatId = chatId;

      // 加载新聊天数据到 activeChatData
      if (chatId && chatData) {
        this.activeChatData[chatId] = chatData;
      }

      // 清理上一个聊天的数据（跳过正在发送的聊天）
      if (previousChatId && previousChatId !== chatId) {
        if (!this.sendingChatIds[previousChatId]) {
          delete this.activeChatData[previousChatId];
        }
      }
    },

    /**
     * 生成聊天标题（对应 generateChatName thunk）
     * 全局开关关闭或生成失败时静默返回 null
     */
    async generateChatName(arg: {
      chat: Chat;
      model: Model;
      historyList: StandardMessage[];
    }): Promise<{ chatId: string; name: string } | null> {
      const { chat, model, historyList } = arg;
      try {
        // 检查全局开关状态
        const appConfig = useAppConfigStore();
        if (!appConfig.autoNamingEnabled) {
          return null;
        }

        // 调用标题生成服务
        const title = await generateChatTitleService(historyList, model);

        return { chatId: chat.id, name: title };
      } catch (error) {
        // 静默处理错误，记录警告日志
        console.warn('Failed to generate chat title:', error);
        return null;
      }
    },

    /**
     * 生成聊天标题成功后的状态落地（对应 generateChatName.fulfilled extraReducer）
     */
    applyGeneratedChatName(payload: { chatId: string; name: string } | null): void {
      if (payload === null) {
        return; // 静默处理失败情况
      }

      const { chatId, name } = payload;
      const now = getCurrentTimestamp();

      // 更新 chatMetaList
      const metaIdx = this.chatMetaList.findIndex((m) => m.id === chatId);
      if (metaIdx !== -1) {
        this.chatMetaList[metaIdx].name = name;
        this.chatMetaList[metaIdx].updatedAt = now;
      }

      // 更新 activeChatData（若已加载）
      const activeChat = this.activeChatData[chatId];
      if (activeChat) {
        activeChat.name = name;
        activeChat.updatedAt = now;
      }
    },

    /**
     * 编辑最新用户消息并重新生成 AI 回复（对应 editAndResendMessage thunk）
     */
    async editAndResendMessage(
      arg: { chatId: string; userMessageId: string; newContent: string },
      signal?: AbortSignal,
    ): Promise<void> {
      const { chatId, userMessageId, newContent } = arg;
      const modelStore = useModelStore();
      const appConfig = useAppConfigStore();

      // pending：加入 sendingChatIds
      this.sendingChatIds[chatId] = true;

      try {
        const chat = this.activeChatData[chatId];
        if (!chat?.chatModelList) {
          delete this.sendingChatIds[chatId];
          return;
        }

        // 1. 提交编辑（原子更新数组）
        this.commitEdit(chatId, userMessageId, newContent);

        // 2. 重新获取最新状态（commitEdit 已更新 chatHistoryList）
        const updatedChat = this.activeChatData[chatId];
        if (!updatedChat?.chatModelList) {
          delete this.sendingChatIds[chatId];
          return;
        }

        // 通过位置索引获取 userMessageIndex
        const userMessageIndex = findMessageIndex(this.$state, chatId, userMessageId);
        if (userMessageIndex === -1) {
          delete this.sendingChatIds[chatId];
          return;
        }

        // 3. 对每个启用模型裁剪历史并调用流式生成
        await Promise.all(
          updatedChat.chatModelList.map((chatModel) => {
            const model = modelStore.models.find((m) => m.id === chatModel.modelId);
            if (isNil(model) || model.isDeleted || !model.isEnable) return undefined;

            // 裁剪历史：不包含编辑的用户消息和旧 AI 回复（用户消息通过 message 参数追加）
            const trimmedHistory = chatModel.chatHistoryList.slice(0, userMessageIndex);

            return (async () => {
              // 初始化 runningChat 结构
              this.initEditRegenerateRunning(chatId, model.id);

              const fetchResponse = streamChatCompletion(
                {
                  model,
                  historyList: trimmedHistory,
                  message: newContent,
                  transmitHistoryReasoning: appConfig.transmitHistoryReasoning,
                },
                { signal },
              );

              for await (const element of fetchResponse) {
                if (signal?.aborted) break;
                this.pushRunningChatHistory(updatedChat, model, element);
              }

              // 4. 流式完成：获取最新状态中的 runningChat 数据
              const runningEntry = this.runningChat[chatId]?.[model.id];
              if (runningEntry?.history) {
                this.updateHistoryContent({
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
          }),
        );

        // fulfilled：移除发送标记
        delete this.sendingChatIds[chatId];
      } catch (error) {
        // rejected：回滚编辑并移除发送标记
        console.error('[editAndResendMessage] failed, rolling back:', {
          chatId,
          userMessageId,
          error,
        });
        this.rollbackEdit(chatId, userMessageId);
        delete this.sendingChatIds[chatId];
        throw error;
      }
    },

    /**
     * 重新生成最后一条 AI 回复（对应 regenerateMessage thunk）
     */
    async regenerateMessage(
      arg: { chatId: string; assistantMessageId: string; historyIndex?: number },
      signal?: AbortSignal,
    ): Promise<void> {
      const { chatId, assistantMessageId, historyIndex } = arg;
      const modelStore = useModelStore();
      const appConfig = useAppConfigStore();

      // pending：加入 sendingChatIds
      this.sendingChatIds[chatId] = true;

      try {
        const chat = this.activeChatData[chatId];
        if (!chat?.chatModelList) {
          delete this.sendingChatIds[chatId];
          return;
        }

        const models = modelStore.models;

        // 通过位置索引获取 assistantMessageIndex
        const assistantMessageIndex = findMessageIndex(
          this.$state,
          chatId,
          assistantMessageId,
        );
        if (assistantMessageIndex === -1) {
          delete this.sendingChatIds[chatId];
          return;
        }

        // 1. 先为每个启用模型初始化 runningChat 条目
        for (const chatModel of chat.chatModelList) {
          const model = models.find((m) => m.id === chatModel.modelId);
          if (isNil(model) || model.isDeleted || !model.isEnable) continue;
          this.initEditRegenerateRunning(chatId, model.id);
        }

        // 2. 提交重新生成（此时 runningChat 条目已存在，可写入回滚字段）
        this.commitRegenerate(chatId, assistantMessageId, historyIndex);

        // 3. 对每个启用模型裁剪历史并调用流式生成
        await Promise.all(
          chat.chatModelList.map((chatModel) => {
            const model = models.find((m) => m.id === chatModel.modelId);
            if (isNil(model) || model.isDeleted || !model.isEnable) return undefined;

            // 裁剪历史：不包含用户消息和旧 AI 回复（用户消息通过 message 参数追加）
            const trimmedHistory = chatModel.chatHistoryList.slice(0, assistantMessageIndex - 1);

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
                  transmitHistoryReasoning: appConfig.transmitHistoryReasoning,
                },
                { signal },
              );

              for await (const element of fetchResponse) {
                if (signal?.aborted) break;
                this.pushRunningChatHistory(chat, model, element);
              }

              // 4. 流式完成
              const runningEntry = this.runningChat[chatId]?.[model.id];
              if (runningEntry?.history) {
                this.updateHistoryContent({
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
          }),
        );

        // fulfilled：移除发送标记
        delete this.sendingChatIds[chatId];
      } catch (error) {
        // rejected：回滚重新生成（传递 historyIndex 防止回滚写入错误索引）并移除发送标记
        this.rollbackRegenerate(chatId, assistantMessageId, historyIndex);
        delete this.sendingChatIds[chatId];
        throw error;
      }
    },
  },
});

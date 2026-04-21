import { Chat, ChatMeta, ChatRoleEnum, StandardMessage, chatToMeta } from "@/types/chat";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { WritableDraft } from "@reduxjs/toolkit";
import { loadChatIndex, loadChatById } from "../storage";
import { RootState } from "..";
import { Model } from "@/types/model";
import { streamChatCompletion, generateChatTitleService } from "@/services/chat";
import { isNil, isNotNil } from "es-toolkit";
import { createIdGenerator } from 'ai'
import { USER_MESSAGE_ID_PREFIX } from "@/utils/constants";
import { getCurrentTimestamp } from "@/utils/utils";
import { selectTransmitHistoryReasoning, selectAutoNamingEnabled } from "./appConfigSlices";
import { getProviderSDKLoader } from "@/services/chat/providerLoader";
import { ModelProviderKeyEnum } from "@/utils/enums";

// 生成用户消息 ID 的工具函数（带前缀）
const generateUserMessageId = createIdGenerator({ prefix: USER_MESSAGE_ID_PREFIX });

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
  runningChat: Record<string, Record<string, {
    isSending: boolean;
    history: StandardMessage | null;
    errorMessage?: string
  }>>;
}

// 聊天管理的初始状态
const initialState: ChatSliceState = {
  chatMetaList: [],
  activeChatData: {},
  sendingChatIds: {},
  loading: false,
  error: null,
  selectedChatId: null,
  initializationError: null,
  runningChat: {},
};


/**
 * @description 异步action：初始化聊天列表，加载索引元数据
 */
export const initializeChatList = createAsyncThunk(
  'chat/initialize',
  async () => {
    try {
      const index: ChatMeta[] = await loadChatIndex();
      // 过滤掉已删除的聊天
      return index.filter(meta => !meta.isDeleted);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize chat data', { cause: error });
    }
  },
)



/**
 * @description 针对某个聊天的每个模型来发送消息
 */
export const sendMessage = createAsyncThunk<
  void,
  {
    chat: Chat;
    message: string;
    model: Model;
    historyList: StandardMessage[];
  }
>(
  'chatModel/sendMessage',
  async({
    chat,
    message,
    model,
    historyList,
  }, { signal, dispatch, getState }) => {
    // 先将当前要发送的内容记录进历史记录
    dispatch(pushChatHistory({
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
    }))

    // 获取是否传输推理内容的开关状态
    const state = getState() as RootState;
    const transmitHistoryReasoning = selectTransmitHistoryReasoning(state);

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

      if (signal.aborted) {
        break
      }
      // 将每条记录放进运行中的记录，以便展示
      dispatch(pushRunningChatHistory({
        chat,
        model,
        message: element,
      }))
    }
  },
)


/**
 * @description 异步 thunk：切换聊天并预加载供应商 SDK + 加载完整数据
 */
export const setSelectedChatIdWithPreload = createAsyncThunk<
  { chatId: string | null; chatData?: Chat },
  string | null,
  { state: RootState }
>(
  'chat/setSelectedChatIdWithPreload',
  async (chatId, { getState }) => {
    if (!chatId) {
      return { chatId: null };
    }

    const state = getState();

    // 从 activeChatData 中查找
    let chatData = state.chat.activeChatData[chatId];

    // 如果未加载，从存储读取
    if (!chatData) {
      const loaded = await loadChatById(chatId);
      if (!loaded) {
        console.warn(`Chat ${chatId} not found in storage`);
        return { chatId };
      }
      chatData = loaded;
    }

    // 预加载聊天使用的供应商 SDK（优化手段，不阻塞聊天切换）
    const { chatModelList = [] } = chatData;

    // 新聊天（无模型）不预加载
    if (chatModelList.length === 0) {
      return { chatId, chatData };
    }

    try {
      const providerSDKLoader = getProviderSDKLoader();
      const { models } = state.models;

      // 提取聊天使用的所有 providerKey
      const providerKeys = new Set<ModelProviderKeyEnum>();
      for (const chatModel of chatModelList) {
        const model = models.find(m => m.id === chatModel.modelId);
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

    return { chatId, chatData };
  }
)


/**
 * @description 异步 thunk：生成聊天标题
 */
export const generateChatName = createAsyncThunk<
  { chatId: string; name: string } | null,
  {
    chat: Chat;
    model: Model;
    historyList: StandardMessage[];
  },
  { state: RootState }
>(
  'chat/generateName',
  async({
    chat,
    model,
    historyList,
  }, { getState }) => {
    try {
      // 检查全局开关状态
      const state = getState();
      const autoNamingEnabled = selectAutoNamingEnabled(state);

      if (!autoNamingEnabled) {
        return null;
      }

      // 调用标题生成服务
      const title = await generateChatTitleService(historyList, model);

      return {
        chatId: chat.id,
        name: title,
      };
    } catch (error) {
      // 静默处理错误，记录警告日志
      console.warn('Failed to generate chat title:', error);
      return null;
    }
  },
)


/**
 * @description 触发发送聊天消息
 */
export const startSendChatMessage = createAsyncThunk<
  void,
  {
    chat: Chat;
    message: string;
  },
  { state: RootState }
>(
  'chatModel/startSendChatMessage',
  async({
    chat,
    message,
  }, { getState, dispatch, signal }) => {
    const state = getState()

    const {
      models,
    } = state.models

    const {
      chatModelList = [],
    } = chat

    await Promise.all(chatModelList.map((chatModel) => {
      const model = models.find(m => m.id === chatModel.modelId)
      // 只有当模型没有被删除，且已经启用的时候，才会进行发送
      if (isNotNil(model) && !model.isDeleted && model.isEnable) {
        return dispatch(sendMessage({
          chat,
          message,
          model,
          historyList: chatModel.chatHistoryList,
        }, {
          // 传递令牌，使得能够中断
          signal,
        }))
      }
    }))
  },
)




/**
 * 在 activeChatData 中定位指定聊天的模型，将消息追加到其历史记录中
 * @param state Immer 可写的聊天状态
 * @param chatId 目标聊天 ID
 * @param modelId 目标模型 ID
 * @param message 要追加的消息，为 null 时静默跳过
 * @returns 追加成功返回 true，聊天/模型不存在或消息为 null 时返回 false
 */
function appendHistoryToModel(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  modelId: string,
  message: StandardMessage | null,
): boolean {
  if (isNil(message)) return false

  const chat = state.activeChatData[chatId]
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
 * @description 更新 chatMetaList 中指定聊天的元数据
 */
function updateMetaInList(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  update: Partial<ChatMeta>,
): void {
  const metaIdx = state.chatMetaList.findIndex(m => m.id === chatId);
  if (metaIdx !== -1) {
    state.chatMetaList[metaIdx] = { ...state.chatMetaList[metaIdx], ...update };
  }
}

/**
 * @description chat 模块管理的 slice
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 设置当前的聊天元数据列表
    setChatMetaList: (state, action: PayloadAction<ChatMeta[]>) => {
      state.chatMetaList = [...action.payload]
    },
    // 设置当前选中的聊天ID
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload
    },
    // 清除操作错误信息
    clearError: (state) => {
      state.error = null;
    },
    // 清除初始化错误信息
    clearInitializationError: (state) => {
      state.initializationError = null;
    },
    // 新增聊天
    createChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const chat = action.payload.chat;
      // 初始化 updatedAt
      if (chat.updatedAt === undefined) {
        chat.updatedAt = getCurrentTimestamp();
      }
      // 同时更新 chatMetaList 和 activeChatData
      state.chatMetaList.unshift(chatToMeta(chat));
      state.activeChatData[chat.id] = chat;
    },
    // 编辑聊天
    editChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload

      // 更新 updatedAt
      chat.updatedAt = getCurrentTimestamp();

      // 更新 activeChatData
      state.activeChatData[chat.id] = { ...chat };

      // 更新 chatMetaList
      updateMetaInList(state, chat.id, chatToMeta(chat));
    },
    // 编辑聊天的名称
    editChatName: (
      state,
      action: PayloadAction<{
        name: string,
        id: string
      }>,
    ) => {
      const {
        id,
        name,
      } = action.payload

      // 验证：不允许空标题（包括空字符串和仅空白字符）
      if (!name || name.trim() === '') {
        return; // 静默拒绝，不更新状态
      }

      const now = getCurrentTimestamp();

      // 更新 chatMetaList
      const metaIdx = state.chatMetaList.findIndex(m => m.id === id);
      if (metaIdx !== -1) {
        state.chatMetaList[metaIdx].name = name;
        state.chatMetaList[metaIdx].isManuallyNamed = true;
        state.chatMetaList[metaIdx].updatedAt = now;
      }

      // 更新 activeChatData（若已加载）
      const activeChat = state.activeChatData[id];
      if (activeChat) {
        activeChat.name = name;
        activeChat.isManuallyNamed = true;
        activeChat.updatedAt = now;
      }
    },
    // 删除聊天
    deleteChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload

      // 检查是否正在发送，若正在发送则跳过
      if (state.sendingChatIds[chat.id]) {
        return;
      }

      // 从 chatMetaList 彻底移除（非软标记）
      state.chatMetaList = state.chatMetaList.filter(m => m.id !== chat.id);

      // 从 activeChatData 中移除
      delete state.activeChatData[chat.id];

      // 判断「是否当前选中的聊天正好是需要被删除的」
      if (state.selectedChatId === chat.id) {
        state.selectedChatId = null;
      }
    },
    // 设置当前活跃聊天数据
    setActiveChatData: (state, action: PayloadAction<{ chatId: string; chat: Chat }>) => {
      const { chatId, chat } = action.payload;
      state.activeChatData[chatId] = chat;
    },
    // 清理指定聊天的活跃数据（跳过正在发送的聊天）
    clearActiveChatData: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      // 跳过正在发送的聊天
      if (state.sendingChatIds[chatId]) {
        return;
      }
      delete state.activeChatData[chatId];
    },
    // 发送结束后回收非当前选中聊天的 activeChatData
    releaseCompletedBackgroundChat: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      if (state.selectedChatId !== chatId) {
        delete state.activeChatData[chatId];
      }
    },
    // 向当前聊天的聊天记录添加内容
    pushRunningChatHistory: (state, action: PayloadAction<{
      chat: Chat;
      model: Model;
      message: StandardMessage;
    }>) => {
      const {
        chat,
        model,
        message,
      } = action.payload

      state.runningChat[chat.id][model.id].history = message
    },
    // 向聊天历史记录添加内容
    pushChatHistory: (state, action: PayloadAction<{
      chat: Chat;
      model: Model;
      message: StandardMessage;
    }>) => {
      const {
        chat,
        model,
        message,
      } = action.payload

      appendHistoryToModel(state, chat.id, model.id, message)
    },
  },
  // 处理异步action的状态变化
  extraReducers: (builder) => {
    builder
      // 初始化模型数据开始
      .addCase(initializeChatList.pending, (state) => {
        state.loading = true;
        state.initializationError = null;
      })
      // 初始化模型数据成功
      .addCase(initializeChatList.fulfilled, (state, action) => {
        state.loading = false;
        state.chatMetaList = action.payload;
      })
      // 初始化模型数据失败
      .addCase(initializeChatList.rejected, (state, action) => {
        state.loading = false;
        state.initializationError = action.error.message || 'Failed to initialize file';
      })
      // 向某个模型发送消息 - 开始
      .addCase(sendMessage.pending, (state, action) => {
        const { chat, model } = action.meta.arg
        // 带有结构初始化的逻辑
        if (isNil(state.runningChat[chat.id])) {
          state.runningChat[chat.id] = {}
        }

        if (isNil(state.runningChat[chat.id][model.id])) {
          state.runningChat[chat.id][model.id] = {
            isSending: true,
            history: null,
            errorMessage: '',
          }
        } else {
          state.runningChat[chat.id][model.id].isSending = true
          state.runningChat[chat.id][model.id].errorMessage = ''
        }

      })
      // 具体每个模型发送消息完成后，将临时数据写回到数组
      .addCase(
        sendMessage.fulfilled,
        (state, action) => {
          const { chat, model } = action.meta.arg
          const currentChatModel = state.runningChat[chat.id][model.id]
          currentChatModel.isSending = false

          // 将临时的数据回写到 activeChatData 中，追加失败时跳过清理
          if (!appendHistoryToModel(state, chat.id, model.id, currentChatModel.history)) return

          // 更新 updatedAt
          const activeChat = state.activeChatData[chat.id];
          if (activeChat) {
            activeChat.updatedAt = getCurrentTimestamp();
            updateMetaInList(state, chat.id, { updatedAt: activeChat.updatedAt });
          }

          // 清理临时数据
          delete state.runningChat[chat.id][model.id]
        },
      )
      // 生成聊天标题成功
      .addCase(generateChatName.fulfilled, (state, action) => {
        if (action.payload === null) {
          return; // 静默处理失败情况
        }

        const { chatId, name } = action.payload;
        const now = getCurrentTimestamp();

        // 更新 chatMetaList
        const metaIdx = state.chatMetaList.findIndex(m => m.id === chatId);
        if (metaIdx !== -1) {
          state.chatMetaList[metaIdx].name = name;
          state.chatMetaList[metaIdx].updatedAt = now;
        }

        // 更新 activeChatData（若已加载）
        const activeChat = state.activeChatData[chatId];
        if (activeChat) {
          activeChat.name = name;
          activeChat.updatedAt = now;
        }
      })
      // 切换聊天并预加载供应商 SDK 成功
      .addCase(setSelectedChatIdWithPreload.fulfilled, (state, action) => {
        const { chatId, chatData } = action.payload;
        const previousChatId = state.selectedChatId;

        state.selectedChatId = chatId;

        // 加载新聊天数据到 activeChatData
        if (chatId && chatData) {
          state.activeChatData[chatId] = chatData;
        }

        // 清理上一个聊天的数据（跳过正在发送的聊天）
        if (previousChatId && previousChatId !== chatId) {
          if (!state.sendingChatIds[previousChatId]) {
            delete state.activeChatData[previousChatId];
          }
        }
      })
      // 具体每个模型发送消息完成后，取消发送状态，回写数据留给 startSendChatMessage 去做
      .addCase(sendMessage.rejected, (state, action) => {
        const {
          message: errorMessage = '',
          stack: errorStack = ''
        } = action.error || {}
        const { chat, model } = action.meta.arg
        const currentChatModel = state.runningChat[chat.id]?.[model.id]
        currentChatModel.isSending = false
        // 记录错误信息
        currentChatModel.errorMessage = errorMessage + errorStack

        console.error('❌ 聊天消息发送失败:', {
          chatId: chat.id,
          chatName: chat.name,
          modelId: model.id,
          modelName: model.modelName,
          modelKey: model.modelKey,
          errorName: action.error?.name,
          errorMessage: action?.error?.message,
          errorStack: action.error?.stack,
          fullAction: action,
        });

      })
      // 总的启动发送消息 - pending：将 chatId 加入 sendingChatIds
      .addCase(startSendChatMessage.pending, (state, action) => {
        const { chat } = action.meta.arg;
        state.sendingChatIds[chat.id] = true;
      })
      // 总的启动发送消息 - fulfilled：将 chatId 从 sendingChatIds 移除
      .addCase(startSendChatMessage.fulfilled, (state, action) => {
        const { chat } = action.meta.arg;
        delete state.sendingChatIds[chat.id];
      })
      // 总的启动发送消息（它会比 sendMessage 先 rejected），将对应 chat 剩余的所有数据回写到数组中
      .addCase(startSendChatMessage.rejected, (state, action) => {
        const { chat } = action.meta.arg;

        // 将 runningChat 中剩余数据回写到 activeChatData
        const currentChat = state.runningChat[chat.id]
        if (isNotNil(currentChat)) {
          Object.entries(currentChat).forEach(([modelId, historyItem]) => {
            appendHistoryToModel(state, chat.id, modelId, historyItem.history)
          })
        }

        // 将 chatId 从 sendingChatIds 移除
        delete state.sendingChatIds[chat.id];
      })
  },
})


// 导出actions
export const {
  clearError,
  clearInitializationError,
  setSelectedChatId,
  createChat,
  editChat,
  editChatName,
  deleteChat,
  setActiveChatData,
  clearActiveChatData,
  releaseCompletedBackgroundChat,
} = chatSlice.actions;

export const {
  pushRunningChatHistory,
  pushChatHistory,
} = chatSlice.actions

// 导出reducer
export default chatSlice.reducer;

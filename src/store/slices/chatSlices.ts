import { Chat, ChatRoleEnum, StandardMessage } from "@/types/chat";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadChatsFromJson } from "../storage";
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
  // 所有聊天的列表
  chatList: Chat[];
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
  chatList: [],
  loading: false,
  error: null,
  selectedChatId: null,
  initializationError: null,
  runningChat: {},
};


/**
 * @description 异步action：初始化聊天列表，会默认选中第一条
 */
export const initializeChatList = createAsyncThunk(
  'chat/initialize',
  async () => {
    try {
      const list: Chat[] = await loadChatsFromJson()
      return list
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize chat data', { cause: error });
    }
  },
)



/**
 * @description 针对某个聊天的每个模型来发送消息
 */
const sendMessage = createAsyncThunk<
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
 * @description 异步 thunk：切换聊天并预加载供应商 SDK
 * 根据聊天使用的模型预加载对应的供应商 SDK
 */
export const setSelectedChatIdWithPreload = createAsyncThunk<
  { chatId: string | null },
  string | null,
  { state: RootState }
>(
  'chat/setSelectedChatIdWithPreload',
  async (chatId, { getState }) => {
    if (!chatId) {
      return { chatId: null };
    }

    const state = getState();
    const chat = state.chat.chatList.find(c => c.id === chatId);
    
    if (!chat) {
      console.warn(`Chat ${chatId} not found for preload`);
      return { chatId };
    }

    // 预加载聊天使用的供应商 SDK（优化手段，不阻塞聊天切换）
    const { chatModelList = [] } = chat;
    
    // 新聊天（无模型）不预加载
    if (chatModelList.length === 0) {
      return { chatId };
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
    
    return { chatId };
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
 * @description chat 模块管理的 slice
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 设置当前的聊天列表
    setChatList: (state, action: PayloadAction<Chat[]>) => {
      state.chatList = [...action.payload]
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
      state.chatList.push(action.payload.chat)
    },
    // 编辑聊天
    editChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload
      const {
        chatList,
      } = state

      const idx = chatList.findIndex(item => item.id === chat.id)
      if (idx !== -1) {
        chatList[idx] = { ...chat }
      }
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
      const {
        chatList,
      } = state

      // 验证：不允许空标题（包括空字符串和仅空白字符）
      if (!name || name.trim() === '') {
        return; // 静默拒绝，不更新状态
      }

      const idx = chatList.findIndex(item => item.id === id)
      if (idx !== -1) {
        chatList[idx].name = name
        // 标记为用户手动命名，后续不再触发自动命名
        chatList[idx].isManuallyNamed = true
      }
    },
    // 删除聊天
    deleteChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload

      const {
        chatList,
      } = state

      // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
      const idx = chatList.findIndex(item => {
        return item.id === chat.id
      })

      if (idx !== -1) {
        // 添加「已删除」标识，不执行真删除
        chatList[idx].isDeleted = true
      }

      // 判断「是否当前选中的聊天正好是需要被删除的」
      if (state.selectedChatId === chat.id) {
        state.selectedChatId = null
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

      // 除非在聊天的过程中被删除，否则都应该存在
      const chatIdx = state.chatList.findIndex(item => item.id === chat.id)
      if (chatIdx === -1) return

      const chatModelList = state.chatList[chatIdx].chatModelList
      if (!Array.isArray(chatModelList)) return

      const modelIdx = chatModelList.findIndex(item => item.modelId === model.id)
      if (modelIdx === -1) return

      if (!Array.isArray(chatModelList[modelIdx].chatHistoryList)) {
        chatModelList[modelIdx].chatHistoryList = []
      }
      // 将消息写到历史记录的数组中
      chatModelList[modelIdx].chatHistoryList.push(message)
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
        state.chatList = action.payload;
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

          // 除非在聊天的过程中被删除，否则都应该存在
          const chatIdx = state.chatList.findIndex(item => item.id === chat.id)
          if (chatIdx === -1) return

          const chatModelList = state.chatList[chatIdx].chatModelList
          if (!Array.isArray(chatModelList)) return

          const modelIdx = chatModelList.findIndex(item => item.modelId === model.id)
          if (modelIdx === -1) return

          if (!Array.isArray(chatModelList[modelIdx].chatHistoryList)) {
            chatModelList[modelIdx].chatHistoryList = []
          }
          // 将临时的数据回写到总的数组中
          chatModelList[modelIdx].chatHistoryList.push(currentChatModel.history as StandardMessage)

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
        const chatIdx = state.chatList.findIndex(item => item.id === chatId);
        if (chatIdx === -1) return;

        // 更新聊天标题
        state.chatList[chatIdx].name = name;
        // 不设置 isManuallyNamed，保持为 false（允许手动覆盖）
      })
      // 切换聊天并预加载供应商 SDK 成功
      .addCase(setSelectedChatIdWithPreload.fulfilled, (state, action) => {
        state.selectedChatId = action.payload.chatId;
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
      // 总的启动发送消息（它会比 sendMessage 先 rejected），将对应 chat 剩余的所有数据回写到数组中
      .addCase(startSendChatMessage.rejected, (state, action) => {
        const { chat } = action.meta.arg
        const currentChat = state.runningChat[chat.id]
        if (isNotNil(currentChat)) {
          Object.entries(currentChat).forEach(([modelId, historyItem]) => {
            // 除非在聊天的过程中被删除，否则都应该存在
            const chatIdx = state.chatList.findIndex(item => item.id === chat.id)
            if (chatIdx === -1) return
  
            const chatModelList = state.chatList[chatIdx].chatModelList
            if (!Array.isArray(chatModelList)) return
  
            const modelIdx = chatModelList.findIndex(item => item.modelId === modelId)
            if (modelIdx === -1) return
  
            if (!Array.isArray(chatModelList[modelIdx].chatHistoryList)) {
              chatModelList[modelIdx].chatHistoryList = []
            }
            // 将临时的数据回写到总的数组中
            if (isNotNil(historyItem.history)) {
              chatModelList[modelIdx].chatHistoryList.push(historyItem.history)
            }
          })
        }

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
} = chatSlice.actions;

const {
  pushRunningChatHistory,
  pushChatHistory,
} = chatSlice.actions

// 导出reducer
export default chatSlice.reducer;
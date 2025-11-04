import { Chat } from "@/types/chat";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  chatList: Chat[];
  // 加载状态
  loading: boolean;
  // 当前选中的聊天
  selectedChat: Chat | null;
  // 操作错误信息
  error: string | null;
  // 初始化错误信息
  initializationError: string | null;
}

// 聊天管理的初始状态
const initialState: ChatState = {
  chatList: [],
  loading: false,
  error: null,
  selectedChat: null,
  initializationError: null,
};


/**
 * @description 异步action：初始化聊天列表，会默认选中第一条
 */
export const initializeChatList = createAsyncThunk(
  'chat/initialize',
  async (_, { dispatch }) => {
    try {
      const list: Chat[] = await (new Promise((resolve) => {
        setTimeout(() => {
          resolve(Array.from({ length: 10 }).map((_, index) => {
            return {
              id: `${index}`,
              name: '你好' + index,
            }
          }))
        }, 1500)
      }))
      // 默认会选中第一条
      dispatch(chatSlice.actions.setSelectChat(list[0] || null))
      return list
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '初始化聊天数据失败');
    }
  },
)

interface BasicChatParams {
  // 新增/编辑/删除的聊天
  chat: Chat;
  // 当前的聊天列表
  chatList: Chat[]
}

/**
 * @description 异步 action: 新增一个聊天
 */
export const createChat = createAsyncThunk(
  'model/add',
  async ({
    chat,
    chatList,
  } : BasicChatParams, { rejectWithValue }) => {
    try {
      const newChatList: Chat[] = [chat, ...chatList]
      // saveModels(newChatList)
      return newChatList
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '新增模型失败');
    }
  },
)


/**
 * @description chat 模块管理的 slice
 */
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectChat: (state, action: PayloadAction<Chat>) => {
      state.selectedChat = action.payload
    },
    // 清除操作错误信息
    clearError: (state) => {
      state.error = null;
    },
    // 清除初始化错误信息
    clearInitializationError: (state) => {
      state.initializationError = null;
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
        state.initializationError = action.error.message || '初始化文件失败';
      })
      // 新增聊天开始
      .addCase(createChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 新增聊天成功
      .addCase(createChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chatList = action.payload;
      })
      // 新增聊天失败
      .addCase(createChat.rejected, (state, action) => {
        state.loading = false;
        state.initializationError = action.error.message || '新增聊天失败';
      })
    },
})

// 导出actions
export const { clearError, clearInitializationError, setSelectChat } = chatSlice.actions;

// 导出reducer
export default chatSlice.reducer;
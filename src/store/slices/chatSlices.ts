import { Chat } from "@/types/chat";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadChatList, saveChatList } from "../vaults/chatVault";

interface ChatState {
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
}

// 聊天管理的初始状态
const initialState: ChatState = {
  chatList: [],
  loading: false,
  error: null,
  selectedChatId: null,
  initializationError: null,
};


/**
 * @description 异步action：初始化聊天列表，会默认选中第一条
 */
export const initializeChatList = createAsyncThunk(
  'chat/initialize',
  async () => {
    try {
      const list: Chat[] = await loadChatList()
      return list
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '初始化聊天数据失败');
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
    // 设置当前的聊天列表
    setChatList: (state, action: PayloadAction<Chat[]>) => {
      state.chatList = [...action.payload]
    },
    // 设置当前选中的聊天ID
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload
    },
    // 清空当前选中的聊天的ID
    clearSelectChatId: (state) => {
      state.selectedChatId = null
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
      const newChatList: Chat[] = [action.payload.chat, ...state.chatList]

      // 保存
      state.chatList = newChatList
      saveChatList(newChatList)
    },
    // 编辑聊天
    editChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload

      const newChatList: Chat[] = [...state.chatList]

      const idx = newChatList.findIndex(item => item.id === chat.id)
      if (idx !== -1) {
        newChatList[idx] = { ...chat }
      }

      // 保存
      state.chatList = newChatList
      saveChatList(newChatList)
    },
    // 删除聊天
    deleteChat: (state, action: PayloadAction<{chat: Chat}>) => {
      const {
        chat,
      } = action.payload

      // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
      const newChatList: Chat[] = [...state.chatList]
      const idx = newChatList.findIndex(item => {
        return item.id === chat.id
      })
      if (idx !== -1) {
        newChatList.splice(idx, 1)
      }

      // 保存
      state.chatList = newChatList
      saveChatList(newChatList)

      // 判断「是否当前选中的聊天正好是需要被删除的」
      if (state.selectedChatId === chat.id) {
        state.selectedChatId = null
      }
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
  },
})

// 导出actions
export const {
  clearError,
  clearInitializationError,
  setSelectedChatId,
  clearSelectChatId,
  createChat,
  editChat,
  deleteChat,
} = chatSlice.actions;

// 导出reducer
export default chatSlice.reducer;
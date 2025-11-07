import { Chat } from "@/types/chat";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadChatList, saveChatList } from "../vaults/chatVault";

interface ChatState {
  chatList: Chat[];
  // 加载状态
  loading: boolean;
  // 当前选中的聊天的Id
  selectedChatId: string | null;
  // 操作错误信息
  error: string | null;
  // 初始化错误信息
  initializationError: string | null;
  // 聊天侧边栏是否折叠
  isSidebarCollapsed: boolean;
}

// 聊天管理的初始状态
const initialState: ChatState = {
  chatList: [],
  loading: false,
  error: null,
  selectedChatId: null,
  initializationError: null,
  isSidebarCollapsed: false,
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
  'chat/add',
  async ({
    chat,
    chatList,
  } : BasicChatParams, { rejectWithValue }) => {
    try {
      const newChatList: Chat[] = [chat, ...chatList]

      saveChatList(newChatList)
      return newChatList
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '新增模型失败');
    }
  },
)

/**
 * @description 异步 action: 编辑一个聊天
 */
export const editChat = createAsyncThunk(
  'chat/edit',
  async ({
    chat,
    chatList,
  } : BasicChatParams, { rejectWithValue }) => {
    try {
      const newChatList: Chat[] = [...chatList]
      const idx = newChatList.findIndex(item => item.id === chat.id)
      if (idx !== -1) {
        newChatList[idx] = { ...chat }
      }

      saveChatList(newChatList)
      return newChatList
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '新增模型失败');
    }
  },
)

/**
 * @description 异步 action: 删除一个聊天
 */
export const deleteChat = createAsyncThunk(
  'chat/delete',
  async ({
    chat,
    chatList,
  } : BasicChatParams, { rejectWithValue, dispatch }) => {
    try {
      // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
      const newChatList: Chat[] = [...chatList]
      const idx = newChatList.findIndex(item => {
        return item.id === chat.id
      })
      if (idx !== -1) {
        newChatList.splice(idx, 1)
      }

      // 保存
      saveChatList(newChatList)

      // 判断「是否当前选中的聊天正好是需要被删除的」
      dispatch(chatSlice.actions.clearSameSelectedChatId(chat.id))

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
    // 设置当前选中的聊天ID
    setSelectedChatId: (state, action: PayloadAction<string | null>) => {
      state.selectedChatId = action.payload
    },
    // 清空当前选中的聊天的ID
    clearSelectChatId: (state) => {
      state.selectedChatId = null
    },
    // 如果传入的聊天ID与当前选中ID相同，则清除选中聊天ID
    clearSameSelectedChatId: (state, action: PayloadAction<string>) => {
      if (state.selectedChatId === action.payload) {
        state.selectedChatId = null
      }
    },
    // 清除操作错误信息
    clearError: (state) => {
      state.error = null;
    },
    // 清除初始化错误信息
    clearInitializationError: (state) => {
      state.initializationError = null;
    },
    // 设置侧边栏是否折叠
    setIsCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
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
        state.error = action.error.message || '删除聊天失败';
      })
      // 删除聊天开始
      .addCase(deleteChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 删除聊天成功
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chatList = action.payload;
      })
      // 删除聊天失败
      .addCase(deleteChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '删除聊天失败';
      })
      // 编辑聊天开始
      .addCase(editChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 编辑聊天成功
      .addCase(editChat.fulfilled, (state, action) => {
        state.loading = false;
        state.chatList = action.payload;
      })
      // 编辑聊天失败
      .addCase(editChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '编辑聊天失败';
      })
  },
})

// 导出actions
export const {
  clearError,
  clearInitializationError,
  setSelectedChatId,
  clearSelectChatId,
  setIsCollapsed,
  clearSameSelectedChatId,
} = chatSlice.actions;
// 导出reducer
export default chatSlice.reducer;
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatPageSliceState {
  // 聊天侧边栏是否折叠
  isSidebarCollapsed: boolean;
  // 是否位于具体聊天页面（目前只有在聊天页面才能折叠侧边栏，否则没有展开按钮来复原）
  isShowChatPage: boolean;
  // 移动端抽屉是否打开
  isDrawerOpen: boolean;
}

// 聊天页面管理的初始状态
const initialState: ChatPageSliceState = {
  isSidebarCollapsed: false,
  isShowChatPage: false,
  isDrawerOpen: false,
};

const chatPageSlice = createSlice({
  name: 'chatPage',
  initialState,
  reducers: {
    // 设置侧边栏是否折叠
    setIsCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
    },
    // 设置是否位于具体聊天页面
    setIsShowChatPage: (state, action: PayloadAction<boolean>) => {
      state.isShowChatPage = action.payload
    },
    // 切换移动端抽屉开关状态
    toggleDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    // 设置移动端抽屉开关状态
    setIsDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isDrawerOpen = action.payload;
    },
  },
})

export const {
  setIsCollapsed,
  setIsShowChatPage,
  toggleDrawer,
  setIsDrawerOpen,
} = chatPageSlice.actions

export default chatPageSlice.reducer

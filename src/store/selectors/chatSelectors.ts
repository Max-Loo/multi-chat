import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

/**
 * input selector：获取选中的聊天 ID
 */
const selectSelectedChatId = (state: RootState) => state.chat.selectedChatId;

/**
 * input selector：获取聊天列表
 */
const selectChatList = (state: RootState) => state.chat.chatList;

/**
 * memoized selector：获取当前选中的聊天对象
 * 只在 find 结果的引用真正变化时才返回新值，避免不必要的重渲染
 */
export const selectSelectedChat = createSelector(
  [selectSelectedChatId, selectChatList],
  (selectedChatId, chatList) =>
    selectedChatId ? chatList.find((c) => c.id === selectedChatId) : undefined,
);

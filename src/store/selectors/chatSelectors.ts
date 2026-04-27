import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import type { ChatMeta } from "@/types/chat";

/**
 * input selector：获取选中的聊天 ID
 */
const selectSelectedChatId = (state: RootState) => state.chat.selectedChatId;

/**
 * input selector：获取聊天元数据列表
 */
const selectChatMetaListRaw = (state: RootState) => state.chat.chatMetaList;

/**
 * input selector：获取活跃聊天数据
 */
const selectActiveChatData = (state: RootState) => state.chat.activeChatData;

/**
 * memoized selector：获取当前选中的聊天对象
 * 从 activeChatData 中获取完整数据
 */
export const selectSelectedChat = createSelector(
  [selectSelectedChatId, selectActiveChatData],
  (selectedChatId, activeChatData) =>
    selectedChatId ? activeChatData[selectedChatId] : undefined,
);

/**
 * memoized selector：获取活跃聊天元数据列表
 */
export const selectChatMetaList = createSelector(
  [selectChatMetaListRaw],
  (metaList): ChatMeta[] => metaList,
);

/**
 * memoized selector：获取当前选中聊天的元数据
 */
export const selectSelectedChatMeta = createSelector(
  [selectSelectedChatId, selectChatMetaListRaw],
  (selectedChatId, metaList) =>
    selectedChatId ? metaList.find(m => m.id === selectedChatId) : undefined,
);

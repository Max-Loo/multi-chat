import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { saveChatList } from "../vaults/chatVault";
import { createChat, deleteChat, editChat, startSendChatMessage } from "../slices/chatSlices";

export const saveModelsMiddleware = createListenerMiddleware<RootState>()

saveModelsMiddleware.startListening({
  // 需要触发保存聊天记录的，都需要声明在这里
  matcher: isAnyOf(
    startSendChatMessage.fulfilled,
    startSendChatMessage.rejected,
    createChat,
    editChat,
    deleteChat,
  ),
  effect: async (action, listenerApi) => {
    console.log('chatList 发生了变化，需要保存', action, listenerApi.getState().chat.chatList);
    await saveChatList(listenerApi.getState().chat.chatList)
  },
})
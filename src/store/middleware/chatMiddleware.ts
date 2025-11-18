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
  effect: async (_, listenerApi) => {
    await saveChatList(listenerApi.getState().chat.chatList)
  },
})
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { saveChatsToJson } from "../storage";
import {
  createChat,
  deleteChat,
  editChat,
  editChatName,
  startSendChatMessage,
} from "../slices/chatSlices";

export const saveChatListMiddleware = createListenerMiddleware<RootState>();

saveChatListMiddleware.startListening({
  // 需要触发保存聊天记录的，都需要声明在这里
  matcher: isAnyOf(
    startSendChatMessage.fulfilled,
    startSendChatMessage.rejected,
    createChat,
    editChat,
    editChatName,
    deleteChat
  ),
  effect: async (_, listenerApi) => {
    await saveChatsToJson(listenerApi.getState().chat.chatList);
  },
});
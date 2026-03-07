import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "..";
import { saveChatsToJson } from "../storage";
import type { Chat } from "@/types/chat";
import {
  createChat,
  deleteChat,
  editChat,
  editChatName,
  startSendChatMessage,
  generateChatName,
} from "../slices/chatSlices";

export const saveChatListMiddleware = createListenerMiddleware<RootState>();

// 用于防止多模型并发时重复生成标题的内存锁
const generatingTitleChatIds = new Set<string>();

// 监听 sendMessage.fulfilled，检测是否需要触发自动标题生成
saveChatListMiddleware.startListening({
  predicate: (action, _currentState, _previousState) => {
    return action.type === 'chatModel/sendMessage/fulfilled';
  },
  effect: async (action: any, listenerApi) => {
    const { chat, model } = action.meta.arg;
    const state = listenerApi.getState();

    // 检查是否正在生成标题（防止竞态条件）
    if (generatingTitleChatIds.has(chat.id)) {
      return;
    }

    // 检查触发条件
    const currentChat = state.chat.chatList.find((c: Chat) => c.id === chat.id);
    if (!currentChat) {
      return;
    }

    // 条件 1：用户未手动命名
    if (currentChat.isManuallyNamed === true) {
      return;
    }

    // 条件 2：全局开关已开启
    if (!state.appConfig.autoNamingEnabled) {
      return;
    }

    // 条件 3：聊天标题为空
    if (currentChat.name !== '' && currentChat.name !== undefined) {
      return;
    }

    // 条件 4：对话长度为 2（第一条用户消息 + 第一条 AI 回复）
    const chatModel = currentChat.chatModelList?.find(cm => cm.modelId === model.id);
    if (!chatModel || chatModel.chatHistoryList.length !== 2) {
      return;
    }

    // 所有条件满足，触发标题生成
    generatingTitleChatIds.add(chat.id);
    listenerApi.dispatch(generateChatName({
      chat,
      model,
      historyList: chatModel.chatHistoryList,
    }) as any);
  },
});

// 监听 generateChatName 完成后移除锁
saveChatListMiddleware.startListening({
  matcher: isAnyOf(generateChatName.fulfilled, generateChatName.rejected),
  effect: async (action: any, _) => {
    if (action.meta?.arg?.chat?.id) {
      generatingTitleChatIds.delete(action.meta.arg.chat.id);
    }
  },
});

saveChatListMiddleware.startListening({
  // 需要触发保存聊天记录的，都需要声明在这里
  matcher: isAnyOf(
    startSendChatMessage.fulfilled,
    startSendChatMessage.rejected,
    createChat,
    editChat,
    editChatName,
    deleteChat,
    generateChatName.fulfilled,
  ),
  effect: async (_, listenerApi) => {
    await saveChatsToJson(listenerApi.getState().chat.chatList);
  },
});
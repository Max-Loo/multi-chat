import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "..";
import {
  loadChatIndex,
  loadChatById,
  saveChatAndIndex,
  deleteChatFromStorage,
} from "../storage";
import type { Chat } from "@/types/chat";
import {
  createChat,
  deleteChat,
  editChat,
  editChatName,
  startSendChatMessage,
  generateChatName,
  releaseCompletedBackgroundChat,
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

    // 从 activeChatData 获取聊天数据
    const currentChat = state.chat.activeChatData[chat.id];
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
      chat: currentChat,
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

// 保存聊天数据到存储
saveChatListMiddleware.startListening({
  // 需要触发保存聊天记录的
  matcher: isAnyOf(
    startSendChatMessage.fulfilled,
    startSendChatMessage.rejected,
    createChat,
    editChat,
    editChatName,
    deleteChat,
    generateChatName.fulfilled,
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState();
    const index = await loadChatIndex();

    // 根据 action 类型确定要保存的聊天 ID
    let chatId: string | undefined;
    let chatData: Chat | undefined;

    if (deleteChat.match(action)) {
      // deleteChat 的中间件 effect：从 action payload 获取 chatId
      // deleteChatFromStorage 会从存储加载完整数据再标记 isDeleted
      const { chat } = action.payload as { chat: Chat };
      await deleteChatFromStorage(chat.id, index);
      return;
    }

    // 其他 action：从 activeChatData 或 action payload 获取聊天数据
    if (createChat.match(action)) {
      chatId = action.payload.chat.id;
      chatData = action.payload.chat;
    } else if (editChat.match(action)) {
      chatId = action.payload.chat.id;
      chatData = action.payload.chat;
    } else if (editChatName.match(action)) {
      chatId = action.payload.id;
      chatData = state.chat.activeChatData[chatId];
      // 聊天未加载到 activeChatData 时，从存储读取后应用重命名
      if (!chatData) {
        const stored = await loadChatById(chatId);
        if (stored) {
          stored.name = action.payload.name;
          stored.isManuallyNamed = true;
          stored.updatedAt = state.chat.chatMetaList.find(m => m.id === chatId)?.updatedAt;
          chatData = stored;
        }
      }
    } else if (generateChatName.fulfilled.match(action) && action.payload) {
      chatId = action.payload.chatId;
      chatData = state.chat.activeChatData[chatId];
    } else if (
      startSendChatMessage.fulfilled.match(action) ||
      startSendChatMessage.rejected.match(action)
    ) {
      chatId = action.meta.arg.chat.id;
      chatData = state.chat.activeChatData[chatId];
    }

    if (chatId && chatData) {
      await saveChatAndIndex(chatId, chatData, index);

      // 发送结束后，回收非当前选中聊天的 activeChatData
      const isSendComplete = startSendChatMessage.fulfilled.match(action) ||
                             startSendChatMessage.rejected.match(action);
      if (isSendComplete) {
        const currentState = listenerApi.getState();
        if (currentState.chat.selectedChatId !== chatId) {
          listenerApi.dispatch(releaseCompletedBackgroundChat(chatId));
        }
      }
    }
  },
});

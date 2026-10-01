/**
 * 聊天数据持久化插件（Pinia）
 *
 * 对应既有 Redux listener middleware：src/store/middleware/chatMiddleware.ts
 * - 持久化：createChat/editChat/editChatName/deleteChat/发送完成/重生成完成 → saveChatAndIndex
 * - 删除兜底：deleteChatFromStorage + 选中聊天被删除时清除 URL 中的 chatId 参数
 * - 自动命名：sendMessage 正常完成后按条件触发 generateChatName（带内存锁防并发重复生成）
 */
import type { PiniaPluginContext } from 'pinia';
import {
  loadChatIndex,
  loadChatById,
  saveChatAndIndex,
  deleteChatFromStorage,
} from '@/store/storage';
import type { Chat } from '@/types/chat';
import { useChatStore, type SendMessageArgs } from '../chatStore';
import { useAppConfigStore } from '../appConfigStore';

/** 需要触发聊天持久化的 action 名称集合（对应 saveChatListMiddleware 的 isAnyOf matcher） */
const PERSIST_ACTIONS = new Set([
  'createChat',
  'editChat',
  'editChatName',
  'deleteChat',
  'startSendChatMessage',
  'generateChatName',
  'editAndResendMessage',
  'regenerateMessage',
]);

// 用于防止多模型并发时重复生成标题的内存锁
const generatingTitleChatIds = new Set<string>();

/**
 * 重置聊天插件状态（仅用于测试）
 */
export const resetChatPluginState = (): void => {
  generatingTitleChatIds.clear();
};

export function installChatPlugin(context: PiniaPluginContext): void {
  // 仅作用于 chat store
  if (context.store.$id !== 'chat') {
    return;
  }

  context.store.$onAction(({ name, args, after, onError }) => {
    // ---------- 自动命名：sendMessage 正常完成后按条件触发 ----------
    if (name === 'sendMessage') {
      after(async () => {
        const [arg] = args as [SendMessageArgs];
        const { chat, model } = arg;
        const chatStore = useChatStore();
        const appConfig = useAppConfigStore();

        // 检查是否正在生成标题（防止竞态条件）
        if (generatingTitleChatIds.has(chat.id)) {
          return;
        }

        // 从 activeChatData 获取聊天数据
        const currentChat = chatStore.activeChatData[chat.id];
        if (!currentChat) {
          return;
        }

        // 条件 1：用户未手动命名
        if (currentChat.isManuallyNamed === true) {
          return;
        }

        // 条件 2：全局开关已开启
        if (!appConfig.autoNamingEnabled) {
          return;
        }

        // 条件 3：聊天标题为空
        if (currentChat.name !== '' && currentChat.name !== undefined) {
          return;
        }

        // 条件 4：对话长度为 2（第一条用户消息 + 第一条 AI 回复）
        const chatModel = currentChat.chatModelList?.find((cm) => cm.modelId === model.id);
        if (!chatModel || chatModel.chatHistoryList.length !== 2) {
          return;
        }

        // 所有条件满足，触发标题生成
        generatingTitleChatIds.add(chat.id);
        try {
          const result = await chatStore.generateChatName({
            chat: currentChat,
            model,
            historyList: chatModel.chatHistoryList,
          });
          chatStore.applyGeneratedChatName(result);
        } finally {
          generatingTitleChatIds.delete(chat.id);
        }
      });
      return;
    }

    // ---------- 持久化：变更后保存聊天数据与索引 ----------
    if (PERSIST_ACTIONS.has(name)) {
      // 发送/重生成失败也需要回收数据 → 监听 onError
      // generateChatName 的结果载荷在 after(result) 的第一个参数中，需透传
      const handleCompletion = (result?: unknown) => {
        void persistChat(name, args, result);
      };

      after(handleCompletion);
      onError(handleCompletion);
    }
  });

  /**
   * 执行聊天持久化（对应 saveChatListMiddleware 的 effect 主体）
   * @param actionName action 名称
   * @param actionArgs action 参数列表
   * @param actionResult action 返回值（generateChatName 使用）
   */
  async function persistChat(
    actionName: string,
    actionArgs: unknown[],
    actionResult?: unknown,
  ): Promise<void> {
    const chatStore = useChatStore();
    const index = await loadChatIndex();

    // 根据 action 类型确定要保存的聊天 ID
    let chatId: string | undefined;
    let chatData: Chat | undefined;

    if (actionName === 'deleteChat') {
      // deleteChat 的持久化：从 action 参数获取 chat
      // deleteChatFromStorage 会从存储加载完整数据再标记 isDeleted
      const [chat] = actionArgs as [Chat];
      await deleteChatFromStorage(chat.id, index);

      // 防御性兜底：如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
      if (chatStore.selectedChatId === chat.id) {
        const url = new URL(window.location.href);
        if (url.searchParams.has('chatId')) {
          url.searchParams.delete('chatId');
          window.history.replaceState({}, '', url.pathname + url.search);
        }
      }

      return;
    }

    // 其他 action：从 action 参数或 activeChatData 获取聊天数据
    if (actionName === 'createChat' || actionName === 'editChat') {
      const [chat] = actionArgs as [Chat];
      chatId = chat.id;
      chatData = chat;
    } else if (actionName === 'editChatName') {
      const [id, chatName] = actionArgs as [string, string];
      chatId = id;
      chatData = chatStore.activeChatData[chatId];
      // 聊天未加载到 activeChatData 时，从存储读取后应用重命名
      if (!chatData) {
        const stored = await loadChatById(chatId);
        if (stored) {
          stored.name = chatName;
          stored.isManuallyNamed = true;
          stored.updatedAt = chatStore.chatMetaList.find((m) => m.id === chatId)?.updatedAt;
          chatData = stored;
        }
      }
    } else if (actionName === 'generateChatName') {
      // generateChatName 的结果载荷通过 after(result) 透传
      const result = actionResult as { chatId: string; name: string } | null | undefined;
      if (result) {
        chatId = result.chatId;
        chatData = chatStore.activeChatData[chatId];
      }
    } else if (
      actionName === 'startSendChatMessage' ||
      actionName === 'editAndResendMessage' ||
      actionName === 'regenerateMessage'
    ) {
      // startSendChatMessage 的 arg 含 chat；其余含 chatId
      const [arg] = actionArgs as [{ chat?: Chat; chatId?: string }];
      chatId = arg.chat?.id ?? arg.chatId;
      chatData = chatId ? chatStore.activeChatData[chatId] : undefined;
    }

    if (chatId && chatData) {
      await saveChatAndIndex(chatId, chatData, index);

      // 发送结束后，回收非当前选中聊天的 activeChatData
      if (actionName === 'startSendChatMessage') {
        if (chatStore.selectedChatId !== chatId) {
          chatStore.releaseCompletedBackgroundChat(chatId);
        }
      }
    }
  }
}

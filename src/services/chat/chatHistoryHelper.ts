import type { ChatSliceState } from '@/store/slices/chatSlices';
import { getCurrentTimestamp } from '@/utils/utils';
import type { WritableDraft } from '@reduxjs/toolkit';
import { ChatRoleEnum } from '@/types/chat';

/**
 * 获取消息内容的当前版本
 * @param content 消息内容（string 或 string[]）
 * @returns 当前版本的内容字符串
 */
export function getCurrentContent(content: string | string[]): string {
  return Array.isArray(content) ? content[content.length - 1] : content;
}

/**
 * 将内容转换为数组形式（追加新元素）
 * @param content 当前内容
 * @param newElement 要追加的新元素
 * @returns 追加后的数组
 */
function pushContent(content: string | string[], newElement: string): string[] {
  if (Array.isArray(content)) {
    return [...content, newElement];
  }
  return [content, newElement];
}

/**
 * 弹出内容数组的最后一个元素
 * @param content 当前内容
 * @returns 弹出后的内容（仅剩一个元素时恢复为 string）
 */
function popContent(content: string | string[]): string | string[] {
  if (Array.isArray(content)) {
    if (content.length <= 1) {
      return content[0];
    }
    const remaining = content.slice(0, -1);
    // 仅剩一个元素时恢复为 string
    return remaining.length === 1 ? remaining[0] : remaining;
  }
  return content;
}

/**
 * 通过 messageId 在所有 ChatModel 的 chatHistoryList 中定位消息的位置索引
 * @param state 聊天状态
 * @param chatId 聊天 ID
 * @param messageId 消息 ID
 * @returns 位置索引，未找到返回 -1
 */
export function findMessageIndex(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  messageId: string,
): number {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return -1;

  for (const chatModel of chat.chatModelList) {
    const index = chatModel.chatHistoryList.findIndex(msg => msg.id === messageId);
    if (index !== -1) return index;
  }
  return -1;
}

/**
 * 提交编辑：原子更新用户消息和 AI 回复的 content/reasoningContent 数组
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param userMessageId 用户消息 ID
 * @param newContent 编辑后的新内容
 * @returns 操作是否成功
 */
export function commitEdit(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  userMessageId: string,
  newContent: string,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, userMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const { chatHistoryList } = chatModel;
    const userMessage = chatHistoryList[messageIndex];
    if (userMessage) {
      userMessage.content = pushContent(userMessage.content, newContent);
    }

    // AI 回复（索引 + 1 位置）
    const aiMessage = chatHistoryList[messageIndex + 1];
    if (aiMessage && aiMessage.role === ChatRoleEnum.ASSISTANT) {
      aiMessage.content = pushContent(aiMessage.content, '');
      if (aiMessage.reasoningContent !== undefined) {
        aiMessage.reasoningContent = pushContent(aiMessage.reasoningContent, '');
      }
    }
  }

  return true;
}

/**
 * 回滚编辑：恢复用户消息和 AI 回复到编辑前的状态
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param userMessageId 用户消息 ID
 * @returns 操作是否成功
 */
export function rollbackEdit(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  userMessageId: string,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, userMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const { chatHistoryList } = chatModel;
    const userMessage = chatHistoryList[messageIndex];
    if (userMessage && Array.isArray(userMessage.content)) {
      userMessage.content = popContent(userMessage.content);
    }

    const aiMessage = chatHistoryList[messageIndex + 1];
    if (aiMessage && aiMessage.role === ChatRoleEnum.ASSISTANT) {
      if (Array.isArray(aiMessage.content)) {
        aiMessage.content = popContent(aiMessage.content);
      }
      if (aiMessage.reasoningContent !== undefined && Array.isArray(aiMessage.reasoningContent)) {
        aiMessage.reasoningContent = popContent(aiMessage.reasoningContent);
        if (typeof aiMessage.reasoningContent === 'string') {
          aiMessage.reasoningContent = aiMessage.reasoningContent || undefined;
        }
      }
    }
  }

  return true;
}

/**
 * 提交重新生成：将旧 AI 回复 push 进数组，追加空字符串占位
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param assistantMessageId AI 回复消息 ID
 * @returns 操作是否成功
 */
export function commitRegenerate(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  assistantMessageId: string,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, assistantMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const aiMessage = chatModel.chatHistoryList[messageIndex];
    if (aiMessage) {
      aiMessage.content = pushContent(aiMessage.content, '');
      if (aiMessage.reasoningContent !== undefined) {
        aiMessage.reasoningContent = pushContent(aiMessage.reasoningContent, '');
      }
    }
  }

  return true;
}

/**
 * 回滚重新生成：弹出 AI 回复数组中的占位元素
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param assistantMessageId AI 回复消息 ID
 * @returns 操作是否成功
 */
export function rollbackRegenerate(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  assistantMessageId: string,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, assistantMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const aiMessage = chatModel.chatHistoryList[messageIndex];
    if (aiMessage) {
      if (Array.isArray(aiMessage.content)) {
        aiMessage.content = popContent(aiMessage.content);
      }
      if (aiMessage.reasoningContent !== undefined && Array.isArray(aiMessage.reasoningContent)) {
        aiMessage.reasoningContent = popContent(aiMessage.reasoningContent);
        if (typeof aiMessage.reasoningContent === 'string') {
          aiMessage.reasoningContent = aiMessage.reasoningContent || undefined;
        }
      }
    }
  }

  return true;
}

/**
 * 流式完成后更新 AI 回复的 content/reasoningContent 数组最后一个元素
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param modelId 模型 ID
 * @param messageIndex 消息在 chatHistoryList 中的位置索引
 * @param content 新的 content 内容
 * @param reasoningContent 新的 reasoningContent 内容（可选）
 * @returns 操作是否成功
 */
export function updateHistoryContent(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  modelId: string,
  messageIndex: number,
  content: string,
  reasoningContent?: string,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const chatModel = chat.chatModelList.find(cm => cm.modelId === modelId);
  if (!chatModel) return false;

  const aiMessage = chatModel.chatHistoryList[messageIndex];
  if (!aiMessage) return false;

  // 更新 content 数组最后一个元素
  if (Array.isArray(aiMessage.content)) {
    const arr = [...aiMessage.content];
    arr[arr.length - 1] = content;
    aiMessage.content = arr;
  } else {
    aiMessage.content = content;
  }

  // 更新 reasoningContent 数组最后一个元素
  if (reasoningContent !== undefined) {
    if (Array.isArray(aiMessage.reasoningContent)) {
      const arr = [...aiMessage.reasoningContent];
      arr[arr.length - 1] = reasoningContent;
      aiMessage.reasoningContent = arr;
    } else {
      aiMessage.reasoningContent = reasoningContent;
    }
  } else if (Array.isArray(aiMessage.reasoningContent)) {
    const arr = [...aiMessage.reasoningContent];
    arr[arr.length - 1] = '';
    aiMessage.reasoningContent = arr;
  }

  // 清理 runningChat 条目
  if (state.runningChat[chatId]?.[modelId]) {
    delete state.runningChat[chatId][modelId];
  }

  // 更新 updatedAt 时间戳
  chat.updatedAt = getCurrentTimestamp();

  return true;
}

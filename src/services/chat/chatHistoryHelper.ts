import type { ChatSliceState } from '@/store/slices/chatSlices';
import { getCurrentTimestamp } from '@/utils/utils';
import type { WritableDraft } from '@reduxjs/toolkit';
import { ChatRoleEnum } from '@/types/chat';

/**
 * 获取消息内容的当前版本（数组末尾）
 * @param content 消息内容（string 或 string[]）
 * @returns 当前版本的内容字符串
 */
export function getCurrentContent(content: string | string[]): string {
  return Array.isArray(content) ? content[content.length - 1] : content;
}

/**
 * 按索引提取指定版本内容，含越界 clamp
 * @param content 消息内容（string 或 string[]）
 * @param index 目标索引，越界时 clamp 到合法范围
 * @returns 指定索引的内容字符串
 */
export function getContentAtIndex(content: string | string[], index: number): string {
  if (Array.isArray(content)) {
    const clamped = Math.min(Math.max(index, 0), content.length - 1);
    return content[clamped];
  }
  return content;
}

/**
 * 计算内容数组中 clamp 后的目标索引
 * @param content 消息内容（string 或 string[]）
 * @param historyIndex 可选的目标索引
 * @returns clamp 后的索引，非数组或无 historyIndex 时返回 undefined
 */
function resolveTargetIndex(content: string | string[] | undefined, historyIndex?: number): number | undefined {
  if (!Array.isArray(content) || historyIndex === undefined) return undefined;
  return Math.min(Math.max(historyIndex, 0), content.length - 1);
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
      if (Array.isArray(userMessage.content)) {
        userMessage.content.push(newContent);
      } else {
        userMessage.content = [userMessage.content, newContent];
      }
    }

    const aiMessage = chatHistoryList[messageIndex + 1];
    if (aiMessage && aiMessage.role === ChatRoleEnum.ASSISTANT) {
      if (Array.isArray(aiMessage.content)) {
        aiMessage.content.push('');
      } else {
        aiMessage.content = [aiMessage.content, ''];
      }
      if (aiMessage.reasoningContent !== undefined) {
        if (Array.isArray(aiMessage.reasoningContent)) {
          aiMessage.reasoningContent.push('');
        } else {
          aiMessage.reasoningContent = [aiMessage.reasoningContent, ''];
        }
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
 * 提交重新生成：暂存旧 content/reasoningContent 到 runningChat 回滚字段，原地覆盖为空字符串
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param assistantMessageId AI 回复消息 ID
 * @param historyIndex 可选，覆盖指定索引而非数组末尾
 * @returns 操作是否成功
 */
export function commitRegenerate(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  assistantMessageId: string,
  historyIndex?: number,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, assistantMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const aiMessage = chatModel.chatHistoryList[messageIndex];
    if (!aiMessage) continue;

    const modelId = chatModel.modelId;
    const runningEntry = state.runningChat[chatId]?.[modelId];
    if (!runningEntry) continue;

    const contentIdx = resolveTargetIndex(aiMessage.content, historyIndex);
    runningEntry.rollbackContent = contentIdx !== undefined
      ? aiMessage.content[contentIdx]
      : getCurrentContent(aiMessage.content);

    if (Array.isArray(aiMessage.content)) {
      aiMessage.content[contentIdx ?? aiMessage.content.length - 1] = '';
    } else {
      aiMessage.content = '';
    }

    if (aiMessage.reasoningContent !== undefined) {
      const reasoningIdx = resolveTargetIndex(aiMessage.reasoningContent, historyIndex);
      runningEntry.rollbackReasoningContent = reasoningIdx !== undefined
        ? aiMessage.reasoningContent[reasoningIdx]
        : getCurrentContent(aiMessage.reasoningContent);

      if (Array.isArray(aiMessage.reasoningContent)) {
        aiMessage.reasoningContent[reasoningIdx ?? aiMessage.reasoningContent.length - 1] = '';
      } else {
        aiMessage.reasoningContent = '';
      }
    }
  }

  return true;
}

/**
 * 回滚重新生成：从 runningChat 回滚字段恢复 AI 回复的 content/reasoningContent
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param assistantMessageId AI 回复消息 ID
 * @param historyIndex 可选，恢复到指定索引而非数组末尾
 * @returns 操作是否成功
 */
export function rollbackRegenerate(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  assistantMessageId: string,
  historyIndex?: number,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const messageIndex = findMessageIndex(state, chatId, assistantMessageId);
  if (messageIndex === -1) return false;

  for (const chatModel of chat.chatModelList) {
    const aiMessage = chatModel.chatHistoryList[messageIndex];
    if (!aiMessage) continue;

    const modelId = chatModel.modelId;
    const runningEntry = state.runningChat[chatId]?.[modelId];
    if (!runningEntry) continue;

    const contentIdx = resolveTargetIndex(aiMessage.content, historyIndex);

    if (runningEntry.rollbackContent !== undefined) {
      if (Array.isArray(aiMessage.content)) {
        aiMessage.content[contentIdx ?? aiMessage.content.length - 1] = runningEntry.rollbackContent;
      } else {
        aiMessage.content = runningEntry.rollbackContent;
      }
    }

    const reasoningIdx = resolveTargetIndex(aiMessage.reasoningContent, historyIndex);

    if (runningEntry.rollbackReasoningContent !== undefined) {
      if (Array.isArray(aiMessage.reasoningContent)) {
        aiMessage.reasoningContent[reasoningIdx ?? aiMessage.reasoningContent.length - 1] = runningEntry.rollbackReasoningContent;
      } else {
        aiMessage.reasoningContent = runningEntry.rollbackReasoningContent;
      }
    } else if (aiMessage.reasoningContent !== undefined) {
      if (Array.isArray(aiMessage.reasoningContent)) {
        aiMessage.reasoningContent[reasoningIdx ?? aiMessage.reasoningContent.length - 1] = '';
      } else {
        aiMessage.reasoningContent = aiMessage.reasoningContent || undefined;
      }
    }

    delete runningEntry.rollbackContent;
    delete runningEntry.rollbackReasoningContent;
  }

  return true;
}

/**
 * 流式完成后更新 AI 回复的 content/reasoningContent 数组目标元素
 * @param state 聊天状态（Immer 可写）
 * @param chatId 聊天 ID
 * @param modelId 模型 ID
 * @param messageIndex 消息在 chatHistoryList 中的位置索引
 * @param content 新的 content 内容
 * @param reasoningContent 新的 reasoningContent 内容（可选）
 * @param historyIndex 可选，写入指定索引而非数组末尾
 * @returns 操作是否成功
 */
export function updateHistoryContent(
  state: WritableDraft<ChatSliceState>,
  chatId: string,
  modelId: string,
  messageIndex: number,
  content: string,
  reasoningContent?: string,
  historyIndex?: number,
): boolean {
  const chat = state.activeChatData[chatId];
  if (!chat?.chatModelList) return false;

  const chatModel = chat.chatModelList.find(cm => cm.modelId === modelId);
  if (!chatModel) return false;

  const aiMessage = chatModel.chatHistoryList[messageIndex];
  if (!aiMessage) return false;

  const contentIdx = resolveTargetIndex(aiMessage.content, historyIndex);

  if (Array.isArray(aiMessage.content)) {
    aiMessage.content[contentIdx ?? aiMessage.content.length - 1] = content;
  } else {
    aiMessage.content = content;
  }

  if (reasoningContent !== undefined) {
    const reasoningIdx = resolveTargetIndex(aiMessage.reasoningContent, historyIndex);
    if (Array.isArray(aiMessage.reasoningContent)) {
      aiMessage.reasoningContent[reasoningIdx ?? aiMessage.reasoningContent.length - 1] = reasoningContent;
    } else {
      aiMessage.reasoningContent = reasoningContent;
    }
  } else if (Array.isArray(aiMessage.reasoningContent)) {
    const reasoningIdx = resolveTargetIndex(aiMessage.reasoningContent, historyIndex);
    aiMessage.reasoningContent[reasoningIdx ?? aiMessage.reasoningContent.length - 1] = '';
  }

  // 清理 runningChat 条目
  if (state.runningChat[chatId]?.[modelId]) {
    delete state.runningChat[chatId][modelId];
  }

  // 更新 updatedAt 时间戳
  chat.updatedAt = getCurrentTimestamp();

  return true;
}

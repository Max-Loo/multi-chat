import { describe, it, expect } from 'vitest';
import {
  getCurrentContent,
  findMessageIndex,
  commitEdit,
  rollbackEdit,
  commitRegenerate,
  rollbackRegenerate,
  updateHistoryContent,
} from '@/services/chat/chatHistoryHelper';
import type { ChatSliceState } from '@/store/slices/chatSlices';
import { ChatRoleEnum, type Chat, type StandardMessage } from '@/types/chat';
import { createMockMessage, createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';

/**
 * 创建测试用的 ChatSliceState
 */
function createTestState(chatData?: Partial<Record<string, Chat>>): ChatSliceState {
  return {
    chatMetaList: [],
    activeChatData: chatData ?? {},
    sendingChatIds: {},
    loading: false,
    selectedChatId: null,
    error: null,
    initializationError: null,
    runningChat: {},
  } as ChatSliceState;
}

/**
 * 创建带有消息历史的 Chat 对象
 */
function createChatWithHistory(
  chatId: string,
  modelHistories: { modelId: string; messages: StandardMessage[] }[],
): Chat {
  return {
    id: chatId,
    chatModelList: modelHistories.map(({ modelId, messages }) => ({
      modelId,
      chatHistoryList: messages,
    })),
  };
}

// =============================
// Task 8.4: getCurrentContent 测试
// =============================
describe('getCurrentContent', () => {
  it('应该返回自身 当 content 为 string', () => {
    expect(getCurrentContent('hello')).toBe('hello');
  });

  it('应该返回最后一个元素 当 content 为 string[]', () => {
    expect(getCurrentContent(['v1', 'v2', 'v3'])).toBe('v3');
  });

  it('应该返回唯一元素 当 string[] 只有一个元素', () => {
    expect(getCurrentContent(['only'])).toBe('only');
  });
});

// =============================
// Task 8.1: 位置索引定位逻辑测试
// =============================
describe('findMessageIndex', () => {
  it('应该返回正确索引 当消息存在于模型历史中', () => {
    const userMsg = createUserMessage('Hello');
    const aiMsg = createAssistantMessage('Hi');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg, aiMsg] },
      ]),
    });

    const index = findMessageIndex(state as any, 'chat-1', userMsg.id);
    expect(index).toBe(0);
  });

  it('应该返回 -1 当消息不存在', () => {
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Hello')] },
      ]),
    });

    const index = findMessageIndex(state as any, 'chat-1', 'non-existent-id');
    expect(index).toBe(-1);
  });

  it('应该返回 -1 当聊天不存在', () => {
    const state = createTestState();
    const index = findMessageIndex(state as any, 'non-existent-chat', 'any-id');
    expect(index).toBe(-1);
  });

  it('应该在多模型中正确定位消息', () => {
    const userMsg1 = createUserMessage('Hello');
    const aiMsg1 = createAssistantMessage('Hi from model-1');
    const aiMsg2 = createAssistantMessage('Hi from model-2');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg1, aiMsg1] },
        { modelId: 'model-2', messages: [userMsg1, aiMsg2] },
      ]),
    });

    // userMsg1 在第一个模型中找到，index = 0
    const index = findMessageIndex(state as any, 'chat-1', userMsg1.id);
    expect(index).toBe(0);
  });
});

// =============================
// Task 8.2: commitEdit / rollbackEdit 测试
// =============================
describe('commitEdit', () => {
  it('应该将 content 从 string 转为 string[] 并追加新内容', () => {
    const userMsg = createUserMessage('Hello');
    const aiMsg = createAssistantMessage('Hi');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg, aiMsg] },
      ]),
    });

    const result = commitEdit(state as any, 'chat-1', userMsg.id, 'Hello edited');
    expect(result).toBe(true);

    // 用户消息：旧内容 + 新内容
    const updatedUserMsg = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[0];
    expect(updatedUserMsg.content).toEqual(['Hello', 'Hello edited']);

    // AI 回复：旧内容 + 空占位
    const updatedAiMsg = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(updatedAiMsg.content).toEqual(['Hi', '']);
  });

  it('应该跳过 AI 回复更新 当 AI 回复不存在', () => {
    const userMsg = createUserMessage('Hello');
    // 没有对应的 AI 回复
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg] },
      ]),
    });

    const result = commitEdit(state as any, 'chat-1', userMsg.id, 'Edited');
    expect(result).toBe(true);

    const updatedUserMsg = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[0];
    expect(updatedUserMsg.content).toEqual(['Hello', 'Edited']);
  });

  it('应该返回 false 当聊天不存在', () => {
    const state = createTestState();
    const result = commitEdit(state as any, 'non-existent', 'any-id', 'content');
    expect(result).toBe(false);
  });

  it('应该返回 false 当消息不存在', () => {
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Hello')] },
      ]),
    });

    const result = commitEdit(state as any, 'chat-1', 'non-existent-id', 'content');
    expect(result).toBe(false);
  });

  it('应该跨模型同步更新 当多模型并发', () => {
    // 每个模型有独立的用户消息（不同 ID，但相同位置索引）
    const userMsg1 = createUserMessage('Hello');
    const userMsg2 = createUserMessage('Hello');
    const aiMsg1 = createAssistantMessage('Hi 1');
    const aiMsg2 = createAssistantMessage('Hi 2');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg1, aiMsg1] },
        { modelId: 'model-2', messages: [userMsg2, aiMsg2] },
      ]),
    });

    // 使用第一个模型的用户消息 ID 定位
    commitEdit(state as any, 'chat-1', userMsg1.id, 'Edited');

    // 两个模型的用户消息和 AI 回复都应该被更新（通过相同位置索引）
    const model1 = state.activeChatData['chat-1']!.chatModelList![0];
    const model2 = state.activeChatData['chat-1']!.chatModelList![1];

    expect(model1.chatHistoryList[0].content).toEqual(['Hello', 'Edited']);
    expect(model1.chatHistoryList[1].content).toEqual(['Hi 1', '']);
    expect(model2.chatHistoryList[0].content).toEqual(['Hello', 'Edited']);
    expect(model2.chatHistoryList[1].content).toEqual(['Hi 2', '']);
  });
});

describe('rollbackEdit', () => {
  it('应该回滚编辑 恢复到编辑前状态', () => {
    const userMsg = createUserMessage('Hello');
    const aiMsg = createAssistantMessage('Hi');
    // 每个模型独立的副本
    const userMsg2 = createUserMessage('Hello');
    const aiMsg2 = createAssistantMessage('Hi');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [userMsg, aiMsg] },
        { modelId: 'model-2', messages: [userMsg2, aiMsg2] },
      ]),
    });

    // 先提交编辑
    commitEdit(state as any, 'chat-1', userMsg.id, 'Edited');
    // 再回滚
    const result = rollbackEdit(state as any, 'chat-1', userMsg.id);
    expect(result).toBe(true);

    // 恢复为 string
    const userMsgAfter = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[0];
    expect(userMsgAfter.content).toBe('Hello');
    const aiMsgAfter = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(aiMsgAfter.content).toBe('Hi');
  });

  it('应该返回 false 当聊天不存在', () => {
    const state = createTestState();
    const result = rollbackEdit(state as any, 'non-existent', 'any-id');
    expect(result).toBe(false);
  });
});

// =============================
// Task 8.3: commitRegenerate / rollbackRegenerate / updateHistoryContent 测试
// =============================
describe('commitRegenerate', () => {
  it('应该将 AI 回复旧内容 push 进数组并追加空占位', () => {
    const aiMsg = createAssistantMessage('Old response');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Q'), aiMsg] },
      ]),
    });

    const result = commitRegenerate(state as any, 'chat-1', aiMsg.id);
    expect(result).toBe(true);

    const updated = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(updated.content).toEqual(['Old response', '']);
  });

  it('应该返回 false 当聊天不存在', () => {
    const state = createTestState();
    const result = commitRegenerate(state as any, 'non-existent', 'any-id');
    expect(result).toBe(false);
  });
});

describe('rollbackRegenerate', () => {
  it('应该回滚重新生成 弹出占位元素', () => {
    const aiMsg = createAssistantMessage('Old response');
    const aiMsg2 = createAssistantMessage('Old response 2');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Q'), aiMsg] },
        { modelId: 'model-2', messages: [createUserMessage('Q'), aiMsg2] },
      ]),
    });

    // 先 commit
    commitRegenerate(state as any, 'chat-1', aiMsg.id);
    // 再 rollback
    const result = rollbackRegenerate(state as any, 'chat-1', aiMsg.id);
    expect(result).toBe(true);

    const updated = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(updated.content).toBe('Old response');
  });
});

describe('updateHistoryContent', () => {
  it('应该替换 AI 回复 content 数组最后一个元素', () => {
    const aiMsg = createAssistantMessage('Old');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Q'), aiMsg] },
      ]),
    });

    // 先 commitRegenerate 让 content 变成数组
    commitRegenerate(state as any, 'chat-1', aiMsg.id);

    // 然后更新最后一个元素
    const result = updateHistoryContent(state as any, 'chat-1', 'model-1', 1, 'New response');
    expect(result).toBe(true);

    const updated = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(updated.content).toEqual(['Old', 'New response']);
  });

  it('应该同时更新 reasoningContent', () => {
    const aiMsg = createMockMessage({
      role: ChatRoleEnum.ASSISTANT,
      content: 'Old',
      reasoningContent: 'Old reasoning',
    });
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Q'), aiMsg] },
      ]),
    });

    commitRegenerate(state as any, 'chat-1', aiMsg.id);
    updateHistoryContent(state as any, 'chat-1', 'model-1', 1, 'New response', 'New reasoning');

    const updated = state.activeChatData['chat-1']!.chatModelList![0].chatHistoryList[1];
    expect(updated.content).toEqual(['Old', 'New response']);
    expect(updated.reasoningContent).toEqual(['Old reasoning', 'New reasoning']);
  });

  it('应该返回 false 当聊天或模型不存在', () => {
    const state = createTestState();
    const result = updateHistoryContent(state as any, 'non-existent', 'model-1', 0, 'content');
    expect(result).toBe(false);
  });

  it('应该清理 runningChat 条目', () => {
    const aiMsg = createAssistantMessage('Old');
    const state = createTestState({
      'chat-1': createChatWithHistory('chat-1', [
        { modelId: 'model-1', messages: [createUserMessage('Q'), aiMsg] },
      ]),
    });

    // 模拟 runningChat 条目
    (state as any).runningChat = {
      'chat-1': {
        'model-1': { isSending: false, history: null },
      },
    };

    updateHistoryContent(state as any, 'chat-1', 'model-1', 1, 'New');
    expect(state.runningChat['chat-1']?.['model-1']).toBeUndefined();
  });
});

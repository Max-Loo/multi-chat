import { describe, it, expect } from 'vitest';
import { buildMessages } from '@/services/chat/messageTransformer';
import { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';

describe('messageTransformer', () => {
  it('应该转换 system 消息（content 为 string）', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.SYSTEM,
        content: 'You are helpful',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: null,
      },
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'system',
      content: 'You are helpful',
    });
  });

  it('应该转换 user 消息（content 为 Part 数组）', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.USER,
        content: 'Previous message',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: null,
      },
    ];
    const result = buildMessages(historyList, 'New message', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'Previous message' }],
    });
    expect(result[1]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'New message' }],
    });
  });

  it('应该转换 assistant 消息（不含 reasoning）', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.ASSISTANT,
        content: 'Assistant response',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: 'stop',
      },
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'Assistant response' }],
    });
  });

  it('应该转换 assistant 消息（包含 reasoning，开关开启）', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.ASSISTANT,
        content: 'Assistant response',
        reasoningContent: 'Thinking process',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: 'stop',
      },
    ];
    const result = buildMessages(historyList, 'Hello', true);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: [
        { type: 'text', text: 'Assistant response' },
        { type: 'reasoning', text: 'Thinking process' },
      ],
    });
  });

  it('应该转换 assistant 消息（不包含 reasoning，开关关闭）', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.ASSISTANT,
        content: 'Assistant response',
        reasoningContent: 'Thinking process',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: 'stop',
      },
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'Assistant response' }],
    });
  });

  it('应该处理空历史记录', () => {
    const historyList: StandardMessage[] = [];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });
  });

  it('应该处理特殊字符', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: ChatRoleEnum.USER,
        content: 'Message with "quotes" and \'apostrophes\'',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: null,
      },
    ];
    const result = buildMessages(historyList, 'New <message> & special chars', false);
    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual([{ type: 'text', text: 'Message with "quotes" and \'apostrophes\'' }]);
    expect(result[1].content).toEqual([{ type: 'text', text: 'New <message> & special chars' }]);
  });

  it('应该在未知角色时抛出错误', () => {
    const historyList: StandardMessage[] = [
      {
        id: '1',
        role: 'unknown' as ChatRoleEnum,
        content: 'Test',
        timestamp: 1234567890,
        modelKey: 'test-model',
        finishReason: null,
      },
    ];
    expect(() => buildMessages(historyList, 'Hello', false)).toThrow('Unknown role');
  });
});

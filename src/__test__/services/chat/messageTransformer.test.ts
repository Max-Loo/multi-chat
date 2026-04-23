import { describe, it, expect } from 'vitest';
import { buildMessages } from '@/services/chat/messageTransformer';
import { ChatRoleEnum } from '@/types/chat';
import { createMockMessage } from '@/__test__/fixtures/chat';

describe('messageTransformer', () => {
  it('应该转换 system 消息（content 为 string）', () => {
    const historyList = [
      createMockMessage({ role: ChatRoleEnum.SYSTEM, content: 'You are helpful' }),
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'system',
      content: 'You are helpful',
    });
  });

  it('应该转换 user 消息（content 为 Part 数组）', () => {
    const historyList = [
      createMockMessage({ role: ChatRoleEnum.USER, content: 'Previous message' }),
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
    const historyList = [
      createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'Assistant response' }),
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'Assistant response' }],
    });
  });

  it('应该转换 assistant 消息（包含 reasoning，开关开启）', () => {
    const historyList = [
      createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Assistant response',
        reasoningContent: 'Thinking process',
      }),
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
    const historyList = [
      createMockMessage({
        role: ChatRoleEnum.ASSISTANT,
        content: 'Assistant response',
        reasoningContent: 'Thinking process',
      }),
    ];
    const result = buildMessages(historyList, 'Hello', false);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      role: 'assistant',
      content: [{ type: 'text', text: 'Assistant response' }],
    });
  });

  it('应该处理空历史记录', () => {
    const historyList = [] as const;
    const result = buildMessages([...historyList], 'Hello', false);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      role: 'user',
      content: [{ type: 'text', text: 'Hello' }],
    });
  });

  it('应该处理特殊字符', () => {
    const historyList = [
      createMockMessage({
        role: ChatRoleEnum.USER,
        content: 'Message with "quotes" and \'apostrophes\'',
      }),
    ];
    const result = buildMessages(historyList, 'New <message> & special chars', false);
    expect(result).toHaveLength(2);
    expect(result[0].content).toEqual([{ type: 'text', text: 'Message with "quotes" and \'apostrophes\'' }]);
    expect(result[1].content).toEqual([{ type: 'text', text: 'New <message> & special chars' }]);
  });

  it('应该在未知角色时抛出错误', () => {
    const historyList = [
      createMockMessage({ role: 'unknown' as ChatRoleEnum, content: 'Test' }),
    ];
    expect(() => buildMessages(historyList, 'Hello', false)).toThrow('Unknown role');
  });
});

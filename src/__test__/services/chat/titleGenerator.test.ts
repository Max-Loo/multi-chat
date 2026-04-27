import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * titleGenerator 单元测试
 */

import {
  removePunctuation,
  truncateTitle,
  buildTitlePrompt,
  generateChatTitleService,
} from '@/services/chat/titleGenerator';
import { generateText } from 'ai';
import { getProvider } from '@/services/chat/providerFactory';
import { StandardMessage } from '@/types/chat';
import { createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

vi.mock('@/services/chat/providerFactory', () => ({
  getProvider: vi.fn(),
}));

/**
 * Mock generateText 返回指定文本
 * Reason: Vercel AI SDK GenerateTextResult 类型过于复杂（含多个泛型参数和工具调用类型），
 * 测试只需验证 text 字段，使用辅助函数集中管理类型转换。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGenerateTextResult = (text: string) => vi.mocked(generateText).mockResolvedValue({ text } as any);

describe('titleGenerator - 后处理逻辑', () => {
  describe('removePunctuation', () => {
    it('应该移除中文标点符号', () => {
      const input = 'TypeScript 学习方法。';
      const result = removePunctuation(input);
      expect(result).toBe('TypeScript 学习方法');
    });

    it('应该移除英文标点符号', () => {
      const input = 'React Tutorial!';
      const result = removePunctuation(input);
      expect(result).toBe('React Tutorial');
    });

    it('应该移除混合标点符号', () => {
      const input = 'AI 技术发展趋势，2024年！';
      const result = removePunctuation(input);
      expect(result).toBe('AI 技术发展趋势2024年');
    });

    it('应该保留数字和字母', () => {
      const input = 'Vue3 2024';
      const result = removePunctuation(input);
      expect(result).toBe('Vue3 2024');
    });

    it('应该处理空字符串', () => {
      const result = removePunctuation('');
      expect(result).toBe('');
    });

    it('应该移除特殊字符', () => {
      const input = 'TypeScript@#$%学习';
      const result = removePunctuation(input);
      expect(result).toBe('TypeScript学习');
    });
  });

  describe('truncateTitle', () => {
    it('应该保留短标题不变', () => {
      const input = 'AI 技术';
      const result = truncateTitle(input);
      expect(result).toBe('AI 技术');
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('应该截取超长标题', () => {
      const input = '这是一个超过二十个汉字的非常长的标题需要被截断处理才行'; // 25 个字符
      const result = truncateTitle(input);
      expect(result).toBe('这是一个超过二十个汉字的非常长的标题需要'); // 前 20 个字符
      expect(result.length).toBe(20);
    });

    it('应该处理正好 20 个字的标题', () => {
      const input = '12345678901234567890'; // 20 个字符
      const result = truncateTitle(input);
      expect(result).toBe('12345678901234567890');
      expect(result.length).toBe(20);
    });

    it('应该处理空字符串', () => {
      const result = truncateTitle('');
      expect(result).toBe('');
    });

    it('应该处理包含空格的标题', () => {
      const input = 'TypeScript 学习方法与实践 ';
      const result = truncateTitle(input);
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });
});

describe('buildTitlePrompt', () => {
  it('应该从用户和助手消息构建 prompt', () => {
    const messages: StandardMessage[] = [
      createUserMessage('什么是 TypeScript？'),
      createAssistantMessage('TypeScript 是 JavaScript 的超集。'),
    ];
    const result = buildTitlePrompt(messages);
    expect(result).toContain('什么是 TypeScript？');
    expect(result).toContain('TypeScript 是 JavaScript 的超集。');
  });

  it('应该处理单条消息（助手消息为空）', () => {
    const messages: StandardMessage[] = [
      createUserMessage('你好'),
    ];
    const result = buildTitlePrompt(messages);
    expect(result).toContain('你好');
    expect(result).toContain('助手：');
  });

  it('应该处理空消息数组', () => {
    const result = buildTitlePrompt([]);
    expect(result).toContain('用户：');
    expect(result).toContain('助手：');
  });

  it('应该仅使用最后两条消息', () => {
    const messages: StandardMessage[] = [
      createUserMessage('第一条用户消息'),
      createAssistantMessage('第一条助手回复'),
      createUserMessage('第二条用户消息'),
      createAssistantMessage('第二条助手回复'),
      createUserMessage('第三条用户消息'),
    ];
    const result = buildTitlePrompt(messages);
    expect(result).toContain('第三条用户消息');
    // 取 slice(-2) 后只剩最后两条，不包含早期消息
    expect(result).not.toContain('第一条用户消息');
    expect(result).not.toContain('第二条用户消息');
  });
});

describe('generateChatTitleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回经过后处理的标题', async () => {
    const messages: StandardMessage[] = [
      createUserMessage('介绍一下 React'),
      createAssistantMessage('React 是一个前端框架'),
    ];
    const model = createMockModel();

    mockGenerateTextResult('React 入门指南');
    vi.mocked(getProvider).mockResolvedValue(vi.fn().mockReturnValue('mock-model-instance'));

    const result = await generateChatTitleService(messages, model);

    expect(result).toBe('React 入门指南');
    expect(getProvider).toHaveBeenCalledWith(
      model.providerKey,
      model.apiKey,
      model.apiAddress
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.any(String) })
    );
  });

  it('应该在 provider 初始化失败时抛出错误', async () => {
    const messages: StandardMessage[] = [
      createUserMessage('你好'),
      createAssistantMessage('你好！'),
    ];
    const model = createMockModel();

    vi.mocked(getProvider).mockRejectedValue(new Error('API key 无效'));

    await expect(
      generateChatTitleService(messages, model)
    ).rejects.toThrow('API key 无效');
  });

  it('应该在返回空文本时抛出错误', async () => {
    const messages: StandardMessage[] = [
      createUserMessage('你好'),
      createAssistantMessage('你好！'),
    ];
    const model = createMockModel();

    mockGenerateTextResult('');
    vi.mocked(getProvider).mockResolvedValue(vi.fn());

    await expect(
      generateChatTitleService(messages, model)
    ).rejects.toThrow('Generated title is empty');
  });

  it('应该在返回纯标点文本时抛出错误', async () => {
    const messages: StandardMessage[] = [
      createUserMessage('你好'),
      createAssistantMessage('你好！'),
    ];
    const model = createMockModel();

    mockGenerateTextResult('！！！。。。');
    vi.mocked(getProvider).mockResolvedValue(vi.fn());

    await expect(
      generateChatTitleService(messages, model)
    ).rejects.toThrow('Generated title is empty');
  });

  it('应该截取超长文本到 20 个字符', async () => {
    const longTitle = '这是一个非常非常长的标题需要被截断处理才行';
    const messages: StandardMessage[] = [
      createUserMessage('你好'),
      createAssistantMessage('你好！'),
    ];
    const model = createMockModel();

    mockGenerateTextResult(longTitle);
    vi.mocked(getProvider).mockResolvedValue(vi.fn());

    const result = await generateChatTitleService(messages, model);

    expect(result).toBe('这是一个非常非常长的标题需要被截断处理才');
    expect(result.length).toBe(20);
  });
});

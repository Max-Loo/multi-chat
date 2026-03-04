import { describe, it, expect, vi } from 'vitest';
import { streamText, generateId } from 'ai';
import { createMockStreamResult } from '@/__test__/helpers';

describe('AI SDK Mock Test', () => {
  it('应该确认 streamText 是 mock 函数', () => {
    console.log('Is streamText a mock function?', vi.isMockFunction(streamText));
    expect(vi.isMockFunction(streamText)).toBe(true);
  });

  it('应该确认 generateId 是 mock 函数', () => {
    console.log('Is generateId a mock function?', vi.isMockFunction(generateId));
    expect(vi.isMockFunction(generateId)).toBe(true);
  });

  it('应该能够使用 createMockStreamResult', async () => {
    // 使用辅助函数创建 mock 结果
    const mockResult = createMockStreamResult([
      { type: 'text-delta', text: 'Hello' },
      { type: 'text-delta', text: ' World' },
    ]);

    // 设置 mock 返回值
    vi.mocked(streamText).mockReturnValueOnce(mockResult as unknown as ReturnType<typeof streamText>);

    const result = streamText({
      model: { provider: 'test', modelId: 'test-model' } as any,
      messages: [],
    });

    // 验证返回了 mock 对象
    expect(result).toBeDefined();
    
    // 验证可以消费流
    const chunks = [];
    for await (const chunk of result.fullStream) {
      chunks.push(chunk);
    }
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ type: 'text-delta', text: 'Hello' });
    expect(chunks[1]).toEqual({ type: 'text-delta', text: ' World' });
  });

  it('应该能够 await streamText 获取元数据', async () => {
    const mockResult = createMockStreamResult([]);
    vi.mocked(streamText).mockReturnValueOnce(mockResult as unknown as ReturnType<typeof streamText>);

    const result = streamText({
      model: { provider: 'test', modelId: 'test-model' } as any,
      messages: [],
    });

    // 验证可以通过 await 获取元数据
    const metadata = await result;
    expect(metadata.finishReason).toBeDefined();
    expect(await metadata.finishReason).toBe('stop');
    expect(await metadata.usage).toEqual({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
    });
  });
});
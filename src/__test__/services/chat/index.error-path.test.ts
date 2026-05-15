/**
 * streamChatCompletion 错误路径测试
 *
 * 测试 MetadataCollectionError 降级路径和非 MetadataCollectionError rethrow 路径
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamChatCompletion } from '@/services/chat';
import { MetadataCollectionError } from '@/services/chat/types';
import { createDeepSeekModel } from '@/__test__/helpers/fixtures/model';

// Mock providerLoader 模块
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn().mockResolvedValue((config: Record<string, unknown>) => {
      return (modelId: string) => ({
        modelId,
        provider: 'mock-provider',
        ...config,
      });
    }),
  }),
}));

// 使用 vi.hoisted 确保 mock 函数在 vi.mock 中可用
const { mockProcessStreamEvents } = vi.hoisted(() => ({
  mockProcessStreamEvents: vi.fn(),
}));

// Mock streamProcessor 以控制 processStreamEvents 的行为
vi.mock('@/services/chat/streamProcessor', () => ({
  processStreamEvents: mockProcessStreamEvents,
}));

/** 收集 async generator 产生的所有消息 */
async function collectMessages(iterable: AsyncIterable<unknown>) {
  const messages: unknown[] = [];
  for await (const msg of iterable) {
    messages.push(msg);
  }
  return messages;
}

describe('streamChatCompletion - 错误路径', () => {
  let mockStreamText: ReturnType<typeof vi.fn>;
  let mockGenerateId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStreamText = vi.fn();
    mockGenerateId = vi.fn(() => 'test-id');
    mockProcessStreamEvents.mockReset();
  });

  it('应该在 MetadataCollectionError 时优雅降级并调用 console.warn', async () => {
    // 模拟 processStreamEvents 抛出 MetadataCollectionError
    // eslint-disable-next-line require-yield -- 异步生成器中 throw 先于 yield，无需 yield
    mockProcessStreamEvents.mockImplementation(async function* () {
      throw new MetadataCollectionError('providerMetadata', 'test metadata error');
    });

    mockStreamText.mockReturnValue({
      // eslint-disable-next-line unicorn/no-thenable
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({}).then(resolve),
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const model = createDeepSeekModel();
    const params = { model, historyList: [], message: 'Hello' };

    // 函数应该正常返回，不抛出错误
    const messages = await collectMessages(
      streamChatCompletion(params, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 测试中 mock 函数需要宽松类型
        dependencies: { streamText: mockStreamText as any, generateId: mockGenerateId as any },
      })
    );

    // 验证优雅降级：不产生消息，不抛出错误
    expect(messages).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Metadata collection failed'),
      expect.any(MetadataCollectionError)
    );

    warnSpy.mockRestore();
  });

  it('应该在非 MetadataCollectionError 时原样抛出错误', async () => {
    // 模拟 processStreamEvents 抛出 TypeError
    // eslint-disable-next-line require-yield -- 异步生成器中 throw 先于 yield，无需 yield
    mockProcessStreamEvents.mockImplementation(async function* () {
      throw new TypeError('Unexpected type error');
    });

    mockStreamText.mockReturnValue({
      // eslint-disable-next-line unicorn/no-thenable
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({}).then(resolve),
    });

    const model = createDeepSeekModel();
    const params = { model, historyList: [], message: 'Hello' };

    // 函数应该将 TypeError 原样抛出
    await expect(
      collectMessages(
        streamChatCompletion(params, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 测试中 mock 函数需要宽松类型
          dependencies: { streamText: mockStreamText as any, generateId: mockGenerateId as any },
        })
      )
    ).rejects.toThrow(TypeError);
  });
});

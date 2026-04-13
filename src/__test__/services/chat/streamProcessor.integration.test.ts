import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { processStreamEvents } from '@/services/chat/streamProcessor';
import { StandardMessage } from '@/types/chat';
import * as metadataCollectorModule from '@/services/chat/metadataCollector';
import type { StandardMessageRawResponse } from '@/types/chat';

// 创建默认的 mock metadata（移到外部作用域）
// 注意：这里返回的是转换后的 StandardMessageRawResponse 格式（timestamp 是 string）
const createDefaultMetadata = (): StandardMessageRawResponse => ({
  response: { id: 'test-id', modelId: 'deepseek-chat', timestamp: '2024-01-01T00:00:00.000Z' },
  request: { body: '{}' },
  usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
  finishReason: { reason: 'stop', rawReason: 'stop' },
  warnings: [],
  sources: undefined,
  providerMetadata: {},
  streamStats: { textDeltaCount: 0, reasoningDeltaCount: 0, duration: 0 },
});

// 创建 AI SDK 原始格式的 metadata（用于 mock StreamResult 的 then 方法）
// 注意：这是 AI SDK 返回的格式，timestamp 是 Date 对象
type MockAISDKMetadata = {
  providerMetadata: Promise<Record<string, unknown>>;
  warnings: Promise<Array<unknown>>;
  sources: Promise<Array<unknown> | undefined>;
  response: {
    id: string;
    modelId: string;
    timestamp: Date;
    headers?: Record<string, unknown>;
  };
  request: {
    body: unknown;
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string | null;
  rawFinishReason?: string | null;
};

const createMockAISDKMetadata = (overrides: Partial<MockAISDKMetadata> = {}): MockAISDKMetadata => ({
  providerMetadata: Promise.resolve({}),
  warnings: Promise.resolve([]),
  sources: Promise.resolve(undefined),
  response: {
    id: 'test-id',
    modelId: 'deepseek-chat',
    timestamp: new Date('2024-01-01T00:00:00.000Z'), // AI SDK 返回 Date 对象
    headers: {},
  },
  request: {
    body: '{}',
  },
  usage: {
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
  },
  finishReason: 'stop',
  rawFinishReason: 'stop',
  ...overrides,
});

describe('streamProcessor', () => {
  let collectAllMetadataSpy: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    // 使用 spyOn 来 mock collectAllMetadata
    collectAllMetadataSpy = vi.spyOn(metadataCollectorModule, 'collectAllMetadata');
  });

  afterEach(() => {
    collectAllMetadataSpy.mockRestore();
  });

  // 创建 mock StreamResult - 正确实现 PromiseLike 和 AsyncIterable
  // aiSDKMetadata 参数是可选的，用于指定 AI SDK 原始格式的 metadata
  function createMockStreamResult(
    events: Array<{ type: string; text?: string }>,
    _metadata?: StandardMessageRawResponse,
    aiSDKMetadata?: MockAISDKMetadata
  ) {
    const streamGen = (async function* () {
      for (const event of events) {
        yield event;
      }
    })();

    // 模拟 AI SDK 的 PromiseLike 接口
    // then 方法返回 AI SDK 原始格式（timestamp 是 Date 对象）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: Vercel AI SDK StreamTextResult 包含 30+ 必填属性，测试 mock 只需实现 then/fullStream/asyncIterator
    const mockResult = {
      // eslint-disable-next-line unicorn/no-thenable
      then: (resolve: (value: MockAISDKMetadata) => unknown) =>
        // 如果提供了 aiSDKMetadata，使用它；否则使用默认值
        Promise.resolve(aiSDKMetadata ?? createMockAISDKMetadata()).then(resolve),
      fullStream: streamGen,
      [Symbol.asyncIterator]: () => streamGen[Symbol.asyncIterator](),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: AI SDK StreamTextResult 包含 30+ 必填属性，mock 只需实现 then/fullStream/asyncIterator
    } as any;

    return mockResult;
  }

  const defaultOptions = {
    conversationId: 'test-conversation',
    timestamp: 1234567890,
    modelKey: 'deepseek-chat',
    throttleInterval: 0, // 禁用节流以确保测试稳定性
  };

  describe('基本流式处理', () => {
    it('应该处理简单的文本流（只有 text-delta）', async () => {
      const events = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 应该有 3 条消息（2 个 text-delta + 1 个最终消息）
      expect(messages.length).toBe(3);
      
      // 第一条消息
      expect(messages[0].content).toBe('Hello');
      expect(messages[0].reasoningContent).toBe('');
      expect(messages[0].raw).toBeNull();

      // 第二条消息
      expect(messages[1].content).toBe('Hello World');
      expect(messages[1].reasoningContent).toBe('');

      // 最终消息
      expect(messages[2].content).toBe('Hello World');
      expect(messages[2].finishReason).toBe('stop');
      expect(messages[2].raw).toEqual(mockMetadata);
      expect(messages[2].usage).toEqual({ inputTokens: 10, outputTokens: 20 });
    });

    it('应该处理包含 reasoning 的流（text-delta + reasoning-delta）', async () => {
      const events = [
        { type: 'reasoning-delta', text: 'Thinking' },
        { type: 'text-delta', text: 'Hello' },
        { type: 'reasoning-delta', text: ' more' },
        { type: 'text-delta', text: ' World' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 应该有 5 条消息
      expect(messages.length).toBe(5);

      // 检查 reasoning 内容累积
      expect(messages[0].reasoningContent).toBe('Thinking');
      expect(messages[1].reasoningContent).toBe('Thinking');
      expect(messages[2].reasoningContent).toBe('Thinking more');
      expect(messages[3].reasoningContent).toBe('Thinking more');

      // 检查文本内容累积
      expect(messages[1].content).toBe('Hello');
      expect(messages[3].content).toBe('Hello World');
    });

    it('应该处理空流（无事件）', async () => {
      const events: Array<{ type: string; text?: string }> = [];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 应该只有最终消息
      expect(messages.length).toBe(1);
      expect(messages[0].content).toBe('');
      expect(messages[0].reasoningContent).toBe('');
    });

    it('应该处理混合事件流（text + reasoning + 其他）', async () => {
      const events = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'reasoning-delta', text: 'Thinking' },
        { type: 'unknown-event', data: 'ignored' }, // 应该被忽略，但仍会 yield
        { type: 'text-delta', text: ' World' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 应该有 5 条消息（每个事件都会 yield，包括 unknown-event）
      expect(messages.length).toBe(5);
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].content).toBe('Hello');
      expect(messages[2].content).toBe('Hello');
      expect(messages[3].content).toBe('Hello World');
      expect(messages[4].content).toBe('Hello World');
    });

    it('应该无条件保存 reasoning-delta 事件', async () => {
      const events = [
        { type: 'reasoning-delta', text: 'Thinking' },
        { type: 'text-delta', text: 'Hello' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // reasoningContent 应该被保存
      expect(messages[0].reasoningContent).toBe('Thinking');
      expect(messages[1].reasoningContent).toBe('Thinking');
    });
  });

  describe('流式统计', () => {
    it('应该正确计算 text-delta 和 reasoning-delta 的数量', async () => {
      const events = [
        { type: 'text-delta', text: 'A' },
        { type: 'text-delta', text: 'B' },
        { type: 'text-delta', text: 'C' },
        { type: 'reasoning-delta', text: '1' },
        { type: 'reasoning-delta', text: '2' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      const finalMessage = messages[messages.length - 1];
      expect(finalMessage.raw?.streamStats?.textDeltaCount).toBe(3);
      expect(finalMessage.raw?.streamStats?.reasoningDeltaCount).toBe(2);
      expect(finalMessage.raw?.streamStats?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('元数据收集', () => {
    it('应该在流式处理完成后调用 collectAllMetadata', async () => {
      const events = [
        { type: 'text-delta', text: 'Hello' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);

      for await (const _ of processStreamEvents(mockResult, defaultOptions)) {
        // 消费所有消息
      }

      expect(collectAllMetadataSpy).toHaveBeenCalledWith(mockResult);
    });

    it('应该在元数据收集失败时抛出错误', async () => {
      const events = [
        { type: 'text-delta', text: 'Hello' },
      ];

      collectAllMetadataSpy.mockRejectedValue(new Error('Metadata collection failed'));

      const mockResult = createMockStreamResult(events, createDefaultMetadata());

      let errorThrown = false;
      try {
        for await (const _ of processStreamEvents(mockResult, defaultOptions)) {
          // 消费所有消息
        }
      } catch (error) {
        errorThrown = true;
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Metadata collection failed');
      }

      expect(errorThrown).toBe(true);
    });

    it('应该在最终消息中包含完整的元数据', async () => {
      const events = [{ type: 'text-delta', text: 'Hello' }];

      const mockMetadata: StandardMessageRawResponse = {
        response: { id: 'test-id', modelId: 'deepseek-chat', timestamp: '2024-01-01T00:00:00.000Z' },
        request: { body: '{"message":"Hello"}' },
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
        finishReason: { reason: 'stop', rawReason: 'stop' },
        warnings: [{ code: 'test', message: 'Test warning' }],
        sources: [{ sourceType: 'url', id: '1', url: 'https://example.com' }],
        providerMetadata: { deepseek: { model: 'deepseek-chat' } },
        streamStats: { textDeltaCount: 1, reasoningDeltaCount: 0, duration: 100 },
      };

      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      const finalMessage = messages[messages.length - 1];
      expect(finalMessage.raw).toEqual(mockMetadata);
      expect(finalMessage.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
      expect(finalMessage.finishReason).toBe('stop');
    });
  });

  describe('节流逻辑', () => {
    it('应该在节流间隔内延迟 yield，间隔到期后 yield 累积内容', async () => {
      const events = [
        { type: 'text-delta', text: 'A' },
        { type: 'text-delta', text: 'B' },
        { type: 'text-delta', text: 'C' },
        { type: 'text-delta', text: 'D' },
        { type: 'text-delta', text: 'E' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      // Mock Date.now() to simulate event timing at 0/30/60/90/120ms
      // Call order: streamStartTime → event1..5 now → streamEndTime
      const mockDateNow = vi.spyOn(Date, 'now');
      mockDateNow
        .mockReturnValueOnce(0)    // streamStartTime
        .mockReturnValueOnce(0)    // event 1: 0-0=0 < 100 → no yield
        .mockReturnValueOnce(30)   // event 2: 30-0=30 < 100 → no yield
        .mockReturnValueOnce(60)   // event 3: 60-0=60 < 100 → no yield
        .mockReturnValueOnce(90)   // event 4: 90-0=90 < 100 → no yield
        .mockReturnValueOnce(120)  // event 5: 120-0=120 >= 100 → yield
        .mockReturnValueOnce(200); // streamEndTime

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, {
        ...defaultOptions,
        throttleInterval: 100,
      })) {
        messages.push(message);
      }

      mockDateNow.mockRestore();

      // 前 4 个事件不 yield，第 5 个 yield，加上最终消息 = 2 条
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe('ABCDE');
      expect(messages[0].raw).toBeNull();
      expect(messages[1].content).toBe('ABCDE');
      expect(messages[1].raw).toBeDefined();
    });

    it('应该在流结束时有未发送更新时立即 yield', async () => {
      const events = [{ type: 'text-delta', text: 'Hello' }];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      // Mock Date.now(): event arrives before throttle interval
      const mockDateNow = vi.spyOn(Date, 'now');
      mockDateNow
        .mockReturnValueOnce(0)    // streamStartTime
        .mockReturnValueOnce(50)   // event 1: 50-0=50 < 1000 → no yield, hasPendingUpdate=true
        .mockReturnValueOnce(100); // streamEndTime

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, {
        ...defaultOptions,
        throttleInterval: 1000,
      })) {
        messages.push(message);
      }

      mockDateNow.mockRestore();

      // 流结束立即 yield 未发送更新 + 最终消息 = 2 条
      expect(messages.length).toBe(2);
      expect(messages[0].content).toBe('Hello');
      expect(messages[0].raw).toBeNull();
      expect(messages[1].raw).toBeDefined();
    });

    it('应该在 throttleInterval=0 时每个事件都 yield', async () => {
      const events = [
        { type: 'text-delta', text: 'A' },
        { type: 'text-delta', text: 'B' },
        { type: 'text-delta', text: 'C' },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 3 条中间消息 + 1 条最终消息 = 4 条
      expect(messages.length).toBe(4);
      expect(messages[0].content).toBe('A');
      expect(messages[1].content).toBe('AB');
      expect(messages[2].content).toBe('ABC');
      expect(messages[3].raw).toBeDefined();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理 text-delta text 为 undefined 的事件', async () => {
      const events = [{ type: 'text-delta', text: undefined as unknown as string }];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // content 累加空字符串，不抛出错误
      expect(messages[0].content).toBe('');
    });

    it('应该正确处理 reasoning-delta text 为 null 的事件', async () => {
      const events = [{ type: 'reasoning-delta', text: null as unknown as string }];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // reasoningContent 累加空字符串
      expect(messages[0].reasoningContent).toBe('');
    });

    it('应该忽略不支持的事件类型且不修改 content', async () => {
      const events = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'tool-call', data: 'ignored' } as unknown as { type: string; text?: string },
      ];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // tool-call 后 content 仍为 Hello（未被修改）
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].content).toBe('Hello');
    });
  });

  describe('消息格式', () => {
    it('应该生成正确格式的 StandardMessage', async () => {
      const events = [{ type: 'text-delta', text: 'Hello' }];

      const mockMetadata = createDefaultMetadata();
      collectAllMetadataSpy.mockResolvedValue(mockMetadata);

      const mockResult = createMockStreamResult(events, mockMetadata);
      const messages: StandardMessage[] = [];

      for await (const message of processStreamEvents(mockResult, defaultOptions)) {
        messages.push(message);
      }

      // 检查所有消息的基本格式
      messages.forEach(msg => {
        expect(msg).toHaveProperty('id');
        expect(msg).toHaveProperty('timestamp');
        expect(msg).toHaveProperty('modelKey');
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('content');
        expect(msg).toHaveProperty('reasoningContent');
        expect(msg).toHaveProperty('raw');
      });

      // 检查最终消息的额外属性
      const finalMessage = messages[messages.length - 1];
      expect(finalMessage.finishReason).toBe('stop');
      expect(finalMessage.usage).toBeDefined();
    });
  });
});

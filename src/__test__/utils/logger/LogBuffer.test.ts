/**
 * LogBuffer 单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LogBuffer } from '@/utils/logger/LogBuffer';
import type { LogEntry } from '@/utils/logger/types';

/** 日志发送函数类型 */
type SendFunction = (entries: LogEntry[]) => Promise<void>;

/**
 * 创建测试用的日志条目
 */
function createTestEntry(message: string): LogEntry {
  return {
    level: 'INFO',
    message,
    timestamp: new Date().toISOString(),
    source: 'frontend',
  };
}

describe('LogBuffer', () => {
  let buffer: LogBuffer;
  let sendFn: SendFunction;

  beforeEach(() => {
    sendFn = vi.fn() as unknown as SendFunction;
    (sendFn as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    buffer = new LogBuffer(sendFn, {
      maxBatchSize: 3,
      maxWaitMs: 100,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should use default config when not provided', () => {
      const defaultBuffer = new LogBuffer(sendFn);
      expect(defaultBuffer.size).toBe(0);
    });

    it('should accept partial config', () => {
      const partialBuffer = new LogBuffer(sendFn, { maxBatchSize: 5 });
      expect(partialBuffer.size).toBe(0);
    });
  });

  describe('batching', () => {
    it('should not send before maxBatchSize reached', () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));
      expect(sendFn).not.toHaveBeenCalled();
    });

    it('should send when maxBatchSize reached', async () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));
      buffer.add(createTestEntry('test3'));

      await vi.runAllTimersAsync();

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'test1' }),
          expect.objectContaining({ message: 'test2' }),
          expect.objectContaining({ message: 'test3' }),
        ])
      );
    });

    it('should send after maxWaitMs', async () => {
      buffer.add(createTestEntry('test1'));

      vi.advanceTimersByTime(50);
      expect(sendFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      await vi.runAllTimersAsync();

      expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should not set multiple timers', () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));

      vi.advanceTimersByTime(50);
      buffer.add(createTestEntry('test3'));

      vi.advanceTimersByTime(50);
      expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should handle batch larger than maxBatchSize', async () => {
      // Add entries that trigger immediate flush
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));
      buffer.add(createTestEntry('test3')); // triggers flush

      await vi.runAllTimersAsync();

      // Add more entries
      buffer.add(createTestEntry('test4'));
      buffer.add(createTestEntry('test5'));
      buffer.add(createTestEntry('test6')); // triggers another flush

      await vi.runAllTimersAsync();

      expect(sendFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('flush', () => {
    it('should flush all pending entries', async () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));

      await buffer.flush();

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ message: 'test1' }),
          expect.objectContaining({ message: 'test2' }),
        ])
      );
    });

    it('should do nothing if buffer is empty', async () => {
      await buffer.flush();
      expect(sendFn).not.toHaveBeenCalled();
    });

    it('should clear buffer after flush', async () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));

      await buffer.flush();

      expect(buffer.size).toBe(0);
    });

    it('should prevent concurrent flushes', async () => {
      buffer.add(createTestEntry('test1'));

      const flushPromise1 = buffer.flush();
      const flushPromise2 = buffer.flush();

      await Promise.all([flushPromise1, flushPromise2]);

      // Should only call sendFn once
      expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should handle send errors gracefully', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Send failed'));
      const errorBuffer = new LogBuffer(errorFn, {
        maxBatchSize: 3,
        maxWaitMs: 100,
      });

      errorBuffer.add(createTestEntry('test1'));
      errorBuffer.add(createTestEntry('test2'));
      errorBuffer.add(createTestEntry('test3'));

      // Should not throw
      await vi.runAllTimersAsync();
      await expect(errorBuffer.flush()).resolves.not.toThrow();
    });
  });

  describe('size', () => {
    it('should return current buffer size', () => {
      expect(buffer.size).toBe(0);
      buffer.add(createTestEntry('test'));
      expect(buffer.size).toBe(1);
    });

    it('should return correct size after multiple adds', () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));
      buffer.add(createTestEntry('test3'));
      expect(buffer.size).toBe(0); // flushed due to maxBatchSize
    });

    it('should return 0 after flush', async () => {
      buffer.add(createTestEntry('test1'));
      buffer.add(createTestEntry('test2'));
      await buffer.flush();
      expect(buffer.size).toBe(0);
    });
  });

  describe('timer management', () => {
    it('should cancel timer on manual flush', async () => {
      buffer.add(createTestEntry('test1'));

      await buffer.flush();

      // Advance time past maxWaitMs
      vi.advanceTimersByTime(200);

      // Should not call sendFn again
      expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer after timeout flush', async () => {
      buffer.add(createTestEntry('test1'));

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(sendFn).toHaveBeenCalledTimes(1);

      // Add new entry and wait for timer
      buffer.add(createTestEntry('test2'));

      vi.advanceTimersByTime(100);
      await vi.runAllTimersAsync();

      expect(sendFn).toHaveBeenCalledTimes(2);
    });
  });
});

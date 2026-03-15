/**
 * Logger 类单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, createLogger } from '@/utils/logger/Logger';

// Mock Tauri 环境
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
  },
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    vi.useFakeTimers();
    logger = createLogger({ module: 'test' });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create logger with config', () => {
      const customLogger = createLogger({ module: 'custom' });
      expect(customLogger).toBeInstanceOf(Logger);
    });

    it('should create logger without config', () => {
      const defaultLogger = createLogger();
      expect(defaultLogger).toBeInstanceOf(Logger);
    });
  });

  describe('log levels', () => {
    it('should have debug method', () => {
      expect(logger.debug).toBeDefined();
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(logger.info).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(logger.warn).toBeDefined();
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(logger.error).toBeDefined();
      expect(typeof logger.error).toBe('function');
    });

    it('should create log entry with correct level', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Test message');
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain('[INFO]');
      expect(callArg).toContain('Test message');

      consoleSpy.mockRestore();
    });

    it('should handle error with Error object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain('[ERROR]');
      expect(callArg).toContain('Error occurred');
      expect(callArg).toContain('Test error');

      consoleSpy.mockRestore();
    });

    it('should handle error with non-Error object', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('Error occurred', { code: 'ERR001' });
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle warn with Error object', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const testError = new Error('Warning error');
      logger.warn('Warning message', testError);
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('context merging', () => {
    it('should merge default context with log context', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const contextLogger = createLogger({
        context: { app: 'test-app' },
      });
      contextLogger.info('Message', { action: 'test' });
      await vi.runAllTimersAsync();
      await contextLogger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain('test-app');
      expect(callArg).toContain('test');

      consoleSpy.mockRestore();
    });

    it('should include module in context', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const moduleLogger = createLogger({ module: 'test-module' });
      moduleLogger.info('Message');
      await vi.runAllTimersAsync();
      await moduleLogger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain('test-module');

      consoleSpy.mockRestore();
    });
  });

  describe('child logger', () => {
    it('should create child logger with merged context', () => {
      const parent = createLogger({ context: { parent: true } });
      const child = parent.child({ context: { child: true } });
      expect(child).toBeInstanceOf(Logger);
    });

    it('should preserve parent module in child', () => {
      const parent = createLogger({ module: 'parent-module' });
      const child = parent.child();
      expect(child).toBeInstanceOf(Logger);
    });
  });

  describe('sanitization', () => {
    it('should sanitize API keys in context', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('API call', { apiKey: 'sk-1234567890abcd' });
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      // API key should be sanitized
      expect(callArg).toContain('sk-1****abcd');
      expect(callArg).not.toContain('sk-1234567890abcd');

      consoleSpy.mockRestore();
    });

    it('should sanitize tokens in context', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      logger.info('Auth', { token: 'secret-token-12345678' });
      await vi.runAllTimersAsync();
      await logger.flush();

      expect(consoleSpy).toHaveBeenCalled();
      const callArg = consoleSpy.mock.calls[0][0];
      expect(callArg).toContain('secr****5678');

      consoleSpy.mockRestore();
    });
  });

  describe('flush', () => {
    it('should have flush method', () => {
      expect(logger.flush).toBeDefined();
      expect(typeof logger.flush).toBe('function');
    });

    it('should resolve without error', async () => {
      await expect(logger.flush()).resolves.not.toThrow();
    });
  });
});

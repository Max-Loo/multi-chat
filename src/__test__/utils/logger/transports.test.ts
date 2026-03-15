/**
 * Transport 单元测试
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { ConsoleTransport } from '@/utils/logger/transports/ConsoleTransport';
import type { LogEntry } from '@/utils/logger/types';

/**
 * 创建测试用的日志条目
 */
function createTestEntry(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' = 'INFO', message: string = 'Test message'): LogEntry {
  return {
    timestamp: '2026-03-15T10:00:00.000Z',
    level,
    source: 'frontend',
    message,
  };
}

describe('TauriTransport', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('should be enabled in Tauri environment', async () => {
    vi.stubGlobal('window', { __TAURI__: {} });
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: vi.fn().mockResolvedValue(undefined),
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();
    expect(transport.isEnabled()).toBe(true);
  });

  it('should be disabled outside Tauri environment', async () => {
    vi.stubGlobal('window', {});
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: vi.fn().mockResolvedValue(undefined),
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();
    expect(transport.isEnabled()).toBe(false);
  });

  it('should be disabled when window is undefined', async () => {
    vi.stubGlobal('window', undefined);
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: vi.fn().mockResolvedValue(undefined),
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();
    expect(transport.isEnabled()).toBe(false);
  });

  it('should call invoke with log entry', async () => {
    const mockInvoke = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('window', { __TAURI__: {} });
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: mockInvoke,
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();

    const entry = createTestEntry('INFO', 'Test message');

    await transport.write(entry);

    expect(mockInvoke).toHaveBeenCalledWith('log_write', {
      entry: {
        level: 'INFO',
        message: 'Test message',
        context: undefined,
        source: 'frontend',
      },
    });
  });

  it('should not call invoke when disabled', async () => {
    const mockInvoke = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('window', {});
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: mockInvoke,
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();

    const entry = createTestEntry();

    await transport.write(entry);

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('should handle invoke errors gracefully', async () => {
    const mockInvoke = vi.fn().mockRejectedValueOnce(new Error('Invoke failed'));
    vi.stubGlobal('window', { __TAURI__: {} });
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: mockInvoke,
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const transport = new TauriTransport();

    const entry = createTestEntry();

    // Should not throw
    await expect(transport.write(entry)).resolves.not.toThrow();

    // Should log error to console
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should include context in invoke call', async () => {
    const mockInvoke = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('window', { __TAURI__: {} });
    vi.doMock('@tauri-apps/api/core', () => ({
      invoke: mockInvoke,
    }));
    const { TauriTransport } = await import('@/utils/logger/transports/TauriTransport');
    const transport = new TauriTransport();

    const entry: LogEntry = {
      ...createTestEntry(),
      context: { userId: '123', action: 'test' },
    };

    await transport.write(entry);

    expect(mockInvoke).toHaveBeenCalledWith('log_write', {
      entry: expect.objectContaining({
        context: { userId: '123', action: 'test' },
      }),
    });
  });
});

describe('ConsoleTransport', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be enabled when explicitly enabled', () => {
    const transport = new ConsoleTransport(true);
    expect(transport.isEnabled()).toBe(true);
  });

  it('should be disabled when explicitly disabled', () => {
    const transport = new ConsoleTransport(false);
    expect(transport.isEnabled()).toBe(false);
  });

  it('should use console.info for INFO level', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry('INFO', 'Info message');

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[INFO]');
    expect(callArg).toContain('Info message');

    consoleSpy.mockRestore();
  });

  it('should use console.debug for DEBUG level', async () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry('DEBUG', 'Debug message');

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[DEBUG]');

    consoleSpy.mockRestore();
  });

  it('should use console.warn for WARN level', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry('WARN', 'Warn message');

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[WARN]');

    consoleSpy.mockRestore();
  });

  it('should use console.error for ERROR level', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry('ERROR', 'Error message');

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[ERROR]');

    consoleSpy.mockRestore();
  });

  it('should not write when disabled', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const transport = new ConsoleTransport(false);

    const entry = createTestEntry('INFO');

    await transport.write(entry);

    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should include context in output', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry: LogEntry = {
      ...createTestEntry(),
      context: { userId: '123', action: 'login' },
    };

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('userId');
    expect(callArg).toContain('123');

    consoleSpy.mockRestore();
  });

  it('should format timestamp correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry();

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[2026-03-15T10:00:00.000Z]');

    consoleSpy.mockRestore();
  });

  it('should format source correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const transport = new ConsoleTransport(true);

    const entry = createTestEntry();

    await transport.write(entry);

    expect(consoleSpy).toHaveBeenCalled();
    const callArg = consoleSpy.mock.calls[0][0];
    expect(callArg).toContain('[frontend]');

    consoleSpy.mockRestore();
  });
});

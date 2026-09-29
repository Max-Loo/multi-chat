/**
 * tauriCompat/shell.ts 变异测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖真实的 WebShellCommand 和 WebShell 实现
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 shell 模块的全局 mock
vi.unmock('@/utils/tauriCompat/shell');

// 覆盖 env 模块的 mock，控制 isTauri 返回值
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => false),
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256' as const,
  DERIVED_KEY_LENGTH: 256,
}));

// Mock @tauri-apps/plugin-shell 防止 Tauri 路径导入失败
vi.mock('@tauri-apps/plugin-shell', () => ({
  Command: {
    create: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue({ code: 0, signal: null, stdout: '', stderr: '' }),
    }),
  },
  open: vi.fn().mockResolvedValue(undefined),
}));

import { Command, shell } from '@/utils/tauriCompat/shell';

describe('tauriCompat/shell', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebShellCommand', () => {
    it('execute 返回精确的模拟结果', async () => {
      const cmd = Command.create('ls');
      expect(await cmd.execute()).toEqual({
        code: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
    });

    it('isSupported 在 Web 环境返回 false', () => {
      const cmd = Command.create('ls');
      expect(cmd.isSupported()).toBe(false);
    });
  });

  describe('WebShell', () => {
    it('open 调用 window.open', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await shell.open('https://example.com');
      expect(openSpy).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');
      openSpy.mockRestore();
    });

    it('isSupported 在 Web 环境返回 true', () => {
      expect(shell.isSupported()).toBe(true);
    });
  });

  describe('Command.create 环境分发', () => {
    it('Web 环境创建 isSupported()=false 的实例', async () => {
      const cmd = Command.create('echo', ['hello']);
      expect(cmd.isSupported()).toBe(false);
      expect(await cmd.execute()).toEqual({
        code: 0,
        signal: null,
        stdout: '',
        stderr: '',
      });
    });
  });

  describe('shell 实例环境分发', () => {
    it('Web 环境 shell.isSupported() 返回 true', () => {
      expect(shell.isSupported()).toBe(true);
    });
  });
});

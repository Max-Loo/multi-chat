/**
 * webRuntime/shell.ts 变异测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖 Null Object 的 Command 实现与 WebShell 实现
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

// 绕过 setup/mocks.ts 对 shell 模块的全局 mock
vi.unmock('@/utils/webRuntime/shell');

import { Command, shell } from '@/utils/webRuntime/shell';

describe('webRuntime/shell', () => {
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

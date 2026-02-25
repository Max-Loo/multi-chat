/**
 * Shell 插件 Mock 实现
 * 用于测试环境，提供与真实 API 一致的接口
 */

import { vi } from 'vitest';

/**
 * Mock ChildProcess 类型
 * 模拟 Tauri Shell 命令执行结果
 */
interface MockChildProcess {
  code: number;
  signal: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Mock Shell 命令类
 * 模拟 Command.create() 返回的对象
 */
class MockShellCommand {
  execute = vi.fn().mockResolvedValue({
    code: 0,
    signal: null,
    stdout: '',
    stderr: '',
  } as MockChildProcess);

  isSupported = vi.fn().mockReturnValue(true);
}

/**
 * Mock Shell 对象
 */
export const shell = {
  open: vi.fn().mockResolvedValue(undefined),
  isSupported: vi.fn().mockReturnValue(true),
};

/**
 * Mock Command 工厂
 */
export const Command = {
  create: vi.fn(() => new MockShellCommand()),
};

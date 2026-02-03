/**
 * Tauri Shell 插件兼容层
 * 提供统一的 Shell API 封装，自动检测运行环境并选择合适的实现
 * 在 Tauri 环境使用原生实现，在 Web 环境使用 Null Object 降级实现
 */

import { Command as TauriCommand, open as tauriOpen, type ChildProcess } from '@tauri-apps/plugin-shell';
import { isTauri } from './env';

/**
 * Shell 命令兼容接口
 * 提供与 Tauri Command 一致的 API，同时支持 isSupported() 方法
 */
interface ShellCommandCompat {
  execute: () => Promise<ChildProcess<string>>;
  isSupported: () => boolean;
}

/**
 * Tauri 环境的 Shell 命令实现
 * 使用 @tauri-apps/plugin-shell 的原生实现
 */
class TauriShellCommand implements ShellCommandCompat {
  private command: TauriCommand<string>;

  constructor(program: string, args?: string[]) {
    this.command = TauriCommand.create(program, args);
  }

  /**
   * 执行 Shell 命令
   * @returns {Promise<ChildProcess<string>>} 命令执行结果
   */
  async execute(): Promise<ChildProcess<string>> {
    return this.command.execute();
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 在 Tauri 环境始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Web 环境的 Shell 命令降级实现（Null Object 模式）
 * 不执行任何实际操作，但保持类型兼容
 */
class WebShellCommand implements ShellCommandCompat {
  // eslint-disable-next-line no-useless-constructor
  constructor(_program: string, _args?: string[]) {
    // 参数保留以保持与 TauriShellCommand 的接口一致性
    // 不执行任何操作（Null Object 模式）
  }

  /**
   * 模拟执行 Shell 命令（实际不执行）
   * @returns {Promise<ChildProcess<string>>} 返回模拟的成功结果
   */
  async execute(): Promise<ChildProcess<string>> {
    // 返回模拟的成功状态
    return {
      code: 0,
      signal: null,
      stdout: '',
      stderr: '',
    };
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 在 Web 环境始终返回 false
   */
  isSupported(): boolean {
    return false;
  }
}

/**
 * 创建 Shell 命令的工厂函数
 * 根据运行环境自动选择合适的实现
 * 
 * @param {string} program - 要执行的程序名称
 * @param {string[]} args - 命令参数（可选）
 * @returns {ShellCommandCompat} Shell 命令兼容接口实例
 * 
 * @example
 * ```typescript
 * import { Command } from '@/utils/tauriCompat';
 * 
 * const cmd = Command.create('ls', ['-la']);
 * if (cmd.isSupported()) {
 *   const output = await cmd.execute();
 *   console.log(output.stdout);
 * } else {
 *   console.log('Shell 功能在 Web 环境中不可用');
 * }
 * ```
 */
export const Command = {
  create: (program: string, args?: string[]): ShellCommandCompat => {
    if (isTauri()) {
      return new TauriShellCommand(program, args);
    } else {
      return new WebShellCommand(program, args);
    }
  },
};

/**
 * Shell 对象兼容接口
 */
interface ShellCompat {
  open: (path: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Tauri 环境的 Shell 实现
 */
class TauriShell implements ShellCompat {
  /**
   * 使用系统默认应用打开路径或 URL
   * @param {string} path - 要打开的路径或 URL
   */
  async open(path: string): Promise<void> {
    return tauriOpen(path);
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} 在 Tauri 环境始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Web 环境的 Shell 降级实现
 * 对于 URL 打开，提供浏览器原生替代方案
 */
class WebShell implements ShellCompat {
  /**
   * 使用浏览器原生 API 打开 URL
   * @param {string} path - 要打开的 URL 或路径
   * @returns {Promise<void>}
   * 
   * @example
   * ```typescript
   * // Web 环境中使用 window.open 打开 URL
   * await shell.open('https://example.com');
   * ```
   */
  async open(path: string): Promise<void> {
    // 使用浏览器原生 API 打开 URL
    // 注意：只能打开 URL，无法打开本地文件路径
    window.open(path, '_blank', 'noopener,noreferrer');
  }

  /**
   * 检查功能是否可用
   * @returns {boolean} Web 环境提供降级实现，返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Shell 对象实例
 * 根据运行环境自动选择合适的实现
 */
export const shell: ShellCompat = isTauri() ? new TauriShell() : new WebShell();

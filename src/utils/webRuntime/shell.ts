/**
 * Shell 功能运行时模块
 * Shell 命令执行在浏览器环境不可用，Command 采用 Null Object 模式；
 * 打开外部链接使用浏览器原生 window.open() 实现
 */

/**
 * 子进程执行结果类型（项目内定义）
 * 形状与原 Shell 命令执行结果保持一致，调用方类型不受迁移影响
 */
export interface ChildProcess<T = string> {
  /** 进程退出码 */
  code: number;
  /** 终止信号（正常退出为 null） */
  signal: string | null;
  /** 标准输出内容 */
  stdout: T;
  /** 标准错误内容 */
  stderr: string;
}

/**
 * Shell 命令接口
 * 提供与原 Shell Command 一致的 API，同时支持 isSupported() 方法
 */
interface ShellCommandCompat {
  execute: () => Promise<ChildProcess<string>>;
  isSupported: () => boolean;
}

/**
 * Shell 命令的 Null Object 实现
 * 不执行任何实际操作，但保持类型兼容，调用方无需做环境分支
 */
class NullShellCommand implements ShellCommandCompat {
  // 参数保留以保持接口一致性，不执行任何操作（Null Object 模式）
  // eslint-disable-next-line no-useless-constructor
  constructor(_program: string, _args?: string[]) {}

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
   * @returns {boolean} 浏览器环境不支持 Shell 命令执行，始终返回 false
   */
  isSupported(): boolean {
    return false;
  }
}

/**
 * 创建 Shell 命令的工厂函数
 *
 * @param {string} program - 要执行的程序名称
 * @param {string[]} args - 命令参数（可选）
 * @returns {ShellCommandCompat} Shell 命令接口实例（Null Object 实现）
 *
 * @example
 * ```typescript
 * import { Command } from '@/utils/webRuntime';
 *
 * const cmd = Command.create('ls', ['-la']);
 * if (cmd.isSupported()) {
 *   const output = await cmd.execute();
 *   console.log(output.stdout);
 * } else {
 *   console.log('Shell 功能在浏览器环境中不可用');
 * }
 * ```
 */
export const Command = {
  create: (program: string, args?: string[]): ShellCommandCompat =>
    new NullShellCommand(program, args),
};

/**
 * Shell 对象接口
 */
interface ShellCompat {
  open: (path: string) => Promise<void>;
  isSupported: () => boolean;
}

/**
 * Shell 对象实现
 * 使用浏览器原生 window.open() 打开 URL
 */
class WebShell implements ShellCompat {
  /**
   * 使用浏览器原生 API 打开 URL
   * @param {string} path - 要打开的 URL 或路径
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // 使用 window.open 打开 URL
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
   * @returns {boolean} URL 打开功能基于浏览器原生 API，始终返回 true
   */
  isSupported(): boolean {
    return true;
  }
}

/**
 * Shell 对象实例
 */
export const shell: ShellCompat = new WebShell();

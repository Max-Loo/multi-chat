import { describe, it, expect } from 'vitest';
import { Command, shell } from '@/utils/tauriCompat/shell';

/**
 * Shell 兼容层测试套件
 *
 * 测试 src/utils/tauriCompat/shell.ts 模块的功能
 * 覆盖 Command.create() 和 shell.open() 的核心场景
 */
describe('Shell 兼容层', () => {
  describe('Command.create', () => {
    it('应该创建 Shell 命令实例', () => {
      const cmd = Command.create('ls', ['-la']);

      expect(cmd).toBeDefined();
      expect(typeof cmd.execute).toBe('function');
      expect(typeof cmd.isSupported).toBe('function');
    });

    it('应该支持不同的命令和参数', () => {
      const cmd1 = Command.create('echo', ['hello']);
      const cmd2 = Command.create('node', ['--version']);

      expect(cmd1).toBeDefined();
      expect(cmd2).toBeDefined();
    });
  });

  describe('TauriShellCommand/WebShellCommand', () => {
    it('应该支持 execute 方法', async () => {
      const cmd = Command.create('ls');

      const result = await cmd.execute();

      // 验证返回一个对象
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('应该支持 isSupported 方法', () => {
      const cmd = Command.create('ls');

      const supported = cmd.isSupported();

      expect(typeof supported).toBe('boolean');
    });
  });

  describe('shell.open', () => {
    it('应该导出 shell 对象', () => {
      expect(shell).toBeDefined();
      expect(typeof shell.open).toBe('function');
    });

    it('shell.open 应该是异步函数', async () => {
      const openPromise = shell.open('https://example.com');

      expect(openPromise).toBeInstanceOf(Promise);
      await openPromise;
    });
  });

  describe('类型定义', () => {
    it('Command 返回值应该有正确的类型', () => {
      const cmd = Command.create('test');

      expect(cmd.execute).toBeDefined();
      expect(cmd.isSupported).toBeDefined();
    });

    it('shell 应该有正确的接口', () => {
      expect(shell.open).toBeDefined();
      expect(typeof shell.open).toBe('function');
    });
  });
});

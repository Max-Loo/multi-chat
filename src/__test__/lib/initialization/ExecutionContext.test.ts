/**
 * ExecutionContext 单元测试
 *
 * 测试执行上下文的数据管理功能：
 * - setResult 和 getResult
 * - isSuccess
 * - markSuccess
 */

import { describe, it, expect, vi } from 'vitest';
import { InitializationManager } from '@/lib/initialization/InitializationManager';
import type { InitStep } from '@/lib/initialization';

describe('ExecutionContext', () => {
  describe('setResult 和 getResult', () => {
    it('应该存储和检索相同值', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue('value1'),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            // step2 可以访问 step1 的结果
            const result = (context.getResult as any)('step1');
            expect(result).toBe('value1');
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该支持类型安全（泛型支持）', async () => {
      const manager = new InitializationManager();

      const testObject = { key: 'value', count: 42 };

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue(testObject),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            const result = (context.getResult as any)('step1');
            expect(result).toEqual(testObject);
            expect(result?.key).toBe('value');
            expect(result?.count).toBe(42);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该在检索不存在的步骤时返回 undefined', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            const result = (context.getResult as any)('nonExistentStep');
            expect(result).toBeUndefined();
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该覆盖已存在的值', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue('value1'),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            // 手动设置值，应该会覆盖步骤返回的值
            context.setResult('step1', 'value2');
            const result = (context.getResult as any)('step1');
            expect(result).toBe('value2');
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });
  });

  describe('isSuccess', () => {
    it('应该在执行成功的步骤后返回 true', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          dependencies: ['step1'],
          execute: vi.fn().mockImplementation(async (context) => {
            expect(context.isSuccess('step1')).toBe(true);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该在未执行的步骤时返回 false', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            expect(context.isSuccess('step2')).toBe(false);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          dependencies: ['step1'],
          execute: vi.fn().mockResolvedValue(undefined),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该在失败的步骤时返回 false', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          dependencies: ['step1'],
          execute: vi.fn().mockRejectedValue(new Error('Fail')),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Step 2 failed',
          }),
        },
        {
          name: 'step3',
          critical: false,
          dependencies: ['step2'],
          execute: vi.fn().mockImplementation(async (context) => {
            expect(context.isSuccess('step1')).toBe(true);
            expect(context.isSuccess('step2')).toBe(false);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });
  });

  describe('markSuccess', () => {
    it('应该在步骤执行后自动标记为成功', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          dependencies: ['step1'],
          execute: vi.fn().mockImplementation(async (context) => {
            expect(context.isSuccess('step1')).toBe(true);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });
  });

  describe('集成测试', () => {
    it('应该同时管理多个步骤的结果和状态', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'step1',
          critical: false,
          execute: vi.fn().mockResolvedValue('result1'),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step2',
          critical: false,
          execute: vi.fn().mockResolvedValue({ data: 'result2' }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step3',
          critical: false,
          execute: vi.fn().mockResolvedValue(42),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'step4',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            // 验证所有步骤
            expect(context.isSuccess('step1')).toBe(true);
            expect((context.getResult as any)('step1')).toBe('result1');

            expect(context.isSuccess('step2')).toBe(true);
            expect((context.getResult as any)('step2')).toEqual({
              data: 'result2',
            });

            expect(context.isSuccess('step3')).toBe(true);
            expect((context.getResult as any)('step3')).toBe(42);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该处理复杂对象', async () => {
      const manager = new InitializationManager();

      const complexObject = {
        nested: {
          array: [1, 2, 3],
          string: 'test',
        },
        func: undefined,
      };

      const steps: InitStep[] = [
        {
          name: 'complexStep',
          critical: false,
          execute: vi.fn().mockResolvedValue(complexObject),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'verifyStep',
          critical: false,
          dependencies: ['complexStep'],
          execute: vi.fn().mockImplementation(async (context) => {
            const result = (context.getResult as any)('complexStep');
            expect(result).toEqual(complexObject);
            expect(result?.nested.array).toEqual([1, 2, 3]);
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });

    it('应该处理 null 和 undefined 值', async () => {
      const manager = new InitializationManager();

      const steps: InitStep[] = [
        {
          name: 'nullStep',
          critical: false,
          execute: vi.fn().mockResolvedValue(null),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'undefinedStep',
          critical: false,
          execute: vi.fn().mockResolvedValue(undefined),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
        {
          name: 'verifyStep',
          critical: false,
          execute: vi.fn().mockImplementation(async (context) => {
            expect(context.getResult('nullStep')).toBeNull();
            expect(context.getResult('undefinedStep')).toBeUndefined();
          }),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Error',
          }),
        },
      ];

      await manager.runInitialization({ steps });
    });
  });
});

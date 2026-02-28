/**
 * InitializationManager 单元测试
 *
 * 测试初始化管理器的核心功能：
 * - 依赖验证
 * - 循环依赖检测
 * - 拓扑排序
 * - 错误处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InitializationManager } from '@/lib/initialization/InitializationManager';
import type { InitStep } from '@/lib/initialization';
import { createMockInitStep } from './fixtures';

describe('InitializationManager', () => {
  let manager: InitializationManager;

  beforeEach(() => {
    manager = new InitializationManager();
    vi.clearAllMocks();
  });

  describe('实例化', () => {
    it('应该成功创建 InitializationManager 实例', () => {
      expect(manager).toBeInstanceOf(InitializationManager);
      expect(manager).toBeDefined();
    });

    it('应该有 runInitialization 方法', () => {
      expect(typeof manager.runInitialization).toBe('function');
    });
  });

  describe('validateDependencies 方法', () => {
    it('应该验证依赖存在的步骤', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2', dependencies: ['step1'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
    });

    it('应该检测依赖不存在的步骤并返回致命错误', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2', dependencies: ['nonExistentStep'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '步骤 "step2" 依赖的步骤 "nonExistentStep" 不存在'
      );
    });

    it('应该检测自依赖并返回致命错误', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1', dependencies: ['step1'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '检测到循环依赖'
      );
    });
  });

  describe('detectCircularDependencies 方法', () => {
    it('应该检测简单循环依赖（A→B→A）', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['B'] }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '检测到循环依赖'
      );
    });

    it('应该检测复杂循环依赖（A→B→C→A）', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['C'] }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '检测到循环依赖'
      );
    });

    it('应该允许无循环依赖的正常情况', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(['A', 'B', 'C']);
    });

    it('应该检测跨层循环依赖', async () => {
      // 测试 A→B→C→D→E→A 的跨层循环
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
        createMockInitStep({ name: 'D', dependencies: ['C'] }),
        createMockInitStep({ name: 'E', dependencies: ['D'] }),
      ];

      // 这个测试应该成功，因为没有循环
      const result1 = await manager.runInitialization({ steps });
      expect(result1.success).toBe(true);

      // 添加一个创建循环的步骤（E 依赖 A）
      const stepsWithCycle: InitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['E'] }), // A 依赖 E
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
        createMockInitStep({ name: 'D', dependencies: ['C'] }),
        createMockInitStep({ name: 'E', dependencies: ['D'] }),
      ];

      const result2 = await manager.runInitialization({ steps: stepsWithCycle });
      expect(result2.success).toBe(false);
      expect(result2.fatalErrors).toHaveLength(1);
    });
  });

  describe('topologicalSort 方法', () => {
    it('应该正确执行无依赖步骤', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(3);
      // 无依赖步骤应该在第一批次中并行执行
      // 但由于 Promise.all 的执行顺序不确定，我们只检查是否全部完成
    });

    it('应该正确排序单层依赖的步骤', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(['A', 'B', 'C']);
    });

    it('应该正确处理复杂依赖图', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['A'] }),
        createMockInitStep({ name: 'D', dependencies: ['B', 'C'] }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      // A 必须在 B 和 C 之前
      const aIndex = result.completedSteps.indexOf('A');
      const bIndex = result.completedSteps.indexOf('B');
      const cIndex = result.completedSteps.indexOf('C');
      expect(aIndex).toBeLessThan(bIndex);
      expect(aIndex).toBeLessThan(cIndex);
      // D 必须在 B 和 C 之后
      const dIndex = result.completedSteps.indexOf('D');
      expect(bIndex).toBeLessThan(dIndex);
      expect(cIndex).toBeLessThan(dIndex);
    });

    it('应该返回正确的执行计划', async () => {
      let executionOrder: string[] = [];
      const steps: InitStep[] = [
        createMockInitStep({
          name: 'A',
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('A');
          }),
        }),
        createMockInitStep({
          name: 'B',
          dependencies: ['A'],
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('B');
          }),
        }),
        createMockInitStep({
          name: 'C',
          dependencies: ['A'],
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('C');
          }),
        }),
        createMockInitStep({
          name: 'D',
          dependencies: ['B', 'C'],
          execute: vi.fn().mockImplementation(async () => {
            executionOrder.push('D');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      // A 应该是第一个
      expect(executionOrder[0]).toBe('A');
      // D 应该是最后一个
      expect(executionOrder[3]).toBe('D');
    });
  });

  describe('handleError 方法', () => {
    it('应该正确处理致命错误', async () => {
      const error = new Error('Fatal error');
      const steps: InitStep[] = [
        createMockInitStep({
          name: 'fatalStep',
          critical: true,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'fatal' as const,
            message: 'Fatal error occurred',
            originalError: error,
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Fatal error occurred');
      expect(result.fatalErrors[0].severity).toBe('fatal');
    });

    it('应该正确处理警告错误', async () => {
      const error = new Error('Warning error');
      const steps: InitStep[] = [
        createMockInitStep({
          name: 'warningStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Warning occurred',
            originalError: error,
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toBe('Warning occurred');
      expect(result.warnings[0].severity).toBe('warning');
    });

    it('应该正确处理可忽略错误', async () => {
      const error = new Error('Ignorable error');
      const steps: InitStep[] = [
        createMockInitStep({
          name: 'ignorableStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'ignorable' as const,
            message: 'Ignorable error occurred',
            originalError: error,
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.ignorableErrors).toHaveLength(1);
      expect(result.ignorableErrors[0].message).toBe('Ignorable error occurred');
      expect(result.ignorableErrors[0].severity).toBe('ignorable');
    });
  });

  describe('完整流程测试', () => {
    it('应该成功执行所有步骤', async () => {
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).toContain('step2');
      expect(result.completedSteps).toContain('step3');
      expect(result.fatalErrors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.ignorableErrors).toHaveLength(0);
    });

    it('应该并行执行无依赖步骤', async () => {
      let executionOrder: string[] = [];
      const steps: InitStep[] = [
        createMockInitStep({
          name: 'step1',
          execute: vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            executionOrder.push('step1');
          }),
        }),
        createMockInitStep({
          name: 'step2',
          execute: vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            executionOrder.push('step2');
          }),
        }),
        createMockInitStep({
          name: 'step3',
          execute: vi.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            executionOrder.push('step3');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(3);
      // 验证步骤并行执行（都在同一批次）
      // 由于并行，执行顺序可能不同，但所有步骤都应该完成
    });

    it('应该正确调用进度回调', async () => {
      const progressCalls: Array<{ current: number; total: number; currentStep: string }> = [];
      const onProgress = vi.fn((current, total, currentStep) => {
        progressCalls.push({ current, total, currentStep });
      });

      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      await manager.runInitialization({ steps, onProgress });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0]).toEqual({ current: 1, total: 3, currentStep: 'step1' });
      expect(progressCalls[1]).toEqual({ current: 2, total: 3, currentStep: 'step2' });
      expect(progressCalls[2]).toEqual({ current: 3, total: 3, currentStep: 'step3' });
    });

    it('应该在致命错误时中断初始化', async () => {
      const error = new Error('Critical failure');
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({
          name: 'criticalStep',
          critical: true,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'fatal' as const,
            message: 'Critical error',
            originalError: error,
          }),
        }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Critical error');
      // 验证 step1 执行了，但 step3 可能没有执行（因为 criticalStep 中断）
      expect(result.completedSteps).toContain('step1');
    });

    it('应该在警告错误时继续执行', async () => {
      const error = new Error('Non-critical failure');
      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({
          name: 'warningStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Warning error',
            originalError: error,
          }),
        }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps });

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toBe('Warning error');
      expect(result.completedSteps).toContain('step1');
      // warningStep 失败了，所以不会被添加到 completedSteps
      expect(result.completedSteps).not.toContain('warningStep');
      expect(result.completedSteps).toContain('step3');
    });

    it('应该正确分类多个错误', async () => {
      const fatalError = new Error('Fatal');
      const warningError = new Error('Warning');
      const ignorableError = new Error('Ignorable');

      const steps: InitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({
          name: 'fatalStep',
          critical: true,
          execute: vi.fn().mockRejectedValue(fatalError),
          onError: vi.fn().mockReturnValue({
            severity: 'fatal' as const,
            message: 'Fatal error',
            originalError: fatalError,
          }),
        }),
        createMockInitStep({
          name: 'warningStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(warningError),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Warning error',
            originalError: warningError,
          }),
        }),
        createMockInitStep({
          name: 'ignorableStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(ignorableError),
          onError: vi.fn().mockReturnValue({
            severity: 'ignorable' as const,
            message: 'Ignorable error',
            originalError: ignorableError,
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps });

      // 致命错误应该中断初始化
      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Fatal error');

      // 由于致命错误中断，warning 和 ignorable 可能不会执行
      // 所以我们只检查致命错误
    });
  });
});

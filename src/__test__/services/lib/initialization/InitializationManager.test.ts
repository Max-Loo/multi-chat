/**
 * InitializationManager 单元测试
 *
 * 测试初始化管理器的核心功能：
 * - 依赖验证
 * - 循环依赖检测
 * - 拓扑排序
 * - 错误处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InitializationManager } from '@/services/initialization/InitializationManager';
import type { InitStep, ExecutionContext } from '@/services/initialization';
import { createMockInitStep, type TestInitStep } from './fixtures';

describe('InitializationManager', () => {
  let manager: InitializationManager;

  beforeEach(() => {
    manager = new InitializationManager();
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
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2', dependencies: ['step1'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
    });

    it('应该检测依赖不存在的步骤并返回致命错误', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2', dependencies: ['nonExistentStep'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '步骤 "step2" 依赖的步骤 "nonExistentStep" 不存在'
      );
    });

    it('应该检测自依赖并返回致命错误', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1', dependencies: ['step1'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['B'] }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '检测到循环依赖'
      );
    });

    it('应该检测复杂循环依赖（A→B→C→A）', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['C'] }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('未知初始化错误');
      expect(result.fatalErrors[0].originalError).toBeInstanceOf(Error);
      expect((result.fatalErrors[0].originalError as Error).message).toContain(
        '检测到循环依赖'
      );
    });

    it('应该允许无循环依赖的正常情况', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(['A', 'B', 'C']);
    });

    it('应该检测跨层循环依赖', async () => {
      // 测试 A→B→C→D→E→A 的跨层循环
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
        createMockInitStep({ name: 'D', dependencies: ['C'] }),
        createMockInitStep({ name: 'E', dependencies: ['D'] }),
      ];

      // 这个测试应该成功，因为没有循环
      const result1 = await manager.runInitialization({ steps: steps as unknown as InitStep[] });
      expect(result1.success).toBe(true);

      // 添加一个创建循环的步骤（E 依赖 A）
      const stepsWithCycle: TestInitStep[] = [
        createMockInitStep({ name: 'A', dependencies: ['E'] }), // A 依赖 E
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
        createMockInitStep({ name: 'D', dependencies: ['C'] }),
        createMockInitStep({ name: 'E', dependencies: ['D'] }),
      ];

      const result2 = await manager.runInitialization({ steps: stepsWithCycle as InitStep[] });
      expect(result2.success).toBe(false);
      expect(result2.fatalErrors).toHaveLength(1);
    });
  });

  describe('topologicalSort 方法', () => {
    it('应该正确执行无依赖步骤', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(3);
      // 无依赖步骤应该在第一批次中并行执行
      // 但由于 Promise.all 的执行顺序不确定，我们只检查是否全部完成
    });

    it('应该正确排序单层依赖的步骤', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['B'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(['A', 'B', 'C']);
    });

    it('应该正确处理复杂依赖图', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['A'] }),
        createMockInitStep({ name: 'D', dependencies: ['B', 'C'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Fatal error occurred');
      expect(result.fatalErrors[0].severity).toBe('fatal');
    });

    it('应该正确处理警告错误', async () => {
      const error = new Error('Warning error');
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toBe('Warning occurred');
      expect(result.warnings[0].severity).toBe('warning');
    });

    it('应该正确处理可忽略错误', async () => {
      const error = new Error('Ignorable error');
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.ignorableErrors).toHaveLength(1);
      expect(result.ignorableErrors[0].message).toBe('Ignorable error occurred');
      expect(result.ignorableErrors[0].severity).toBe('ignorable');
    });
  });

  describe('完整流程测试', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });
    it('应该成功执行所有步骤', async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'step1',
          execute: vi.fn().mockImplementation(async () => {
            await vi.advanceTimersByTimeAsync(10);
            executionOrder.push('step1');
          }),
        }),
        createMockInitStep({
          name: 'step2',
          execute: vi.fn().mockImplementation(async () => {
            await vi.advanceTimersByTimeAsync(10);
            executionOrder.push('step2');
          }),
        }),
        createMockInitStep({
          name: 'step3',
          execute: vi.fn().mockImplementation(async () => {
            await vi.advanceTimersByTimeAsync(10);
            executionOrder.push('step3');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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

      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({ name: 'step2' }),
        createMockInitStep({ name: 'step3' }),
      ];

      await manager.runInitialization({ steps: steps as unknown as InitStep[], onProgress });

      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0]).toEqual({ current: 1, total: 3, currentStep: 'step1' });
      expect(progressCalls[1]).toEqual({ current: 2, total: 3, currentStep: 'step2' });
      expect(progressCalls[2]).toEqual({ current: 3, total: 3, currentStep: 'step3' });
    });

    it('应该在致命错误时中断初始化', async () => {
      const error = new Error('Critical failure');
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Critical error');
      // 验证 step1 执行了，但 step3 可能没有执行（因为 criticalStep 中断）
      expect(result.completedSteps).toContain('step1');
    });

    it('应该在警告错误时继续执行', async () => {
      const error = new Error('Non-critical failure');
      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

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

      const steps: TestInitStep[] = [
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

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      // 致命错误应该中断初始化
      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Fatal error');

      // 由于致命错误中断，warning 和 ignorable 可能不会执行
      // 所以我们只检查致命错误
    });
  });

  describe("错误分级交叉组合", () => {
    it("应该在非关键步骤抛出致命错误时不中断初始化", async () => {
      const error = new Error('Fatal but not critical');
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({
          name: 'nonCriticalFatalStep',
          critical: false,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'fatal' as const,
            message: 'Non-critical fatal',
            originalError: error,
          }),
        }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      // critical=false + severity=fatal：记录致命错误但不中断
      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      expect(result.fatalErrors[0].message).toBe('Non-critical fatal');
      // 后续步骤仍然执行
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).toContain('step3');
    });

    it("应该在关键步骤抛出警告时不中断初始化", async () => {
      const error = new Error('Warning from critical step');
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
        createMockInitStep({
          name: 'criticalWarningStep',
          critical: true,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'warning' as const,
            message: 'Critical warning',
            originalError: error,
          }),
        }),
        createMockInitStep({ name: 'step3' }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      // critical=true + severity=warning：记录警告但不中断
      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toBe('Critical warning');
      // 后续步骤仍然执行
      expect(result.completedSteps).toContain('step1');
      expect(result.completedSteps).toContain('step3');
    });
  });

  describe("ExecutionContext 数据传递", () => {
    it("应该支持步骤间通过 context 传递数据", async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'producerStep',
          execute: vi.fn().mockImplementation(async (context) => {
            context.setResult('sharedData', { count: 42, label: 'test' });
            return 'producerResult';
          }),
        }),
        createMockInitStep({
          name: 'consumerStep',
          dependencies: ['producerStep'],
          execute: vi.fn().mockImplementation(async (context: ExecutionContext) => {
            const data = context.getResult<{ count: number; label: string }>('sharedData');
            // 验证数据传递成功
            expect(data).toEqual({ count: 42, label: 'test' });
            return 'consumerResult';
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('producerStep');
      expect(result.completedSteps).toContain('consumerStep');
    });

    it("应该将可选字段从 context 提取到 InitResult", async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'modelProviderStatus',
          execute: vi.fn().mockResolvedValue({ hasError: false, isNoProvidersError: false }),
        }),
        createMockInitStep({
          name: 'masterKeyRegenerated',
          execute: vi.fn().mockResolvedValue(true),
        }),
        createMockInitStep({
          name: 'decryptionFailureCount',
          execute: vi.fn().mockResolvedValue(3),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.modelProviderStatus).toEqual({ hasError: false, isNoProvidersError: false });
      expect(result.masterKeyRegenerated).toBe(true);
      expect(result.decryptionFailureCount).toBe(3);
    });

    it("不应该设置未触发的可选字段属性（杀死 if(true) 变异体）", async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'step1' }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result).not.toHaveProperty('modelProviderStatus');
      expect(result).not.toHaveProperty('masterKeyRegenerated');
      expect(result).not.toHaveProperty('decryptionFailureCount');
    });
  });

  describe("critical+fatal 中断后继步骤", () => {
    it("应该在 critical fatal 错误后不执行依赖步骤", async () => {
      const error = new Error('Critical failure');
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'fatalStep',
          critical: true,
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'fatal' as const,
            message: 'Fatal error',
            originalError: error,
          }),
        }),
        createMockInitStep({
          name: 'dependentStep',
          dependencies: ['fatalStep'],
          execute: vi.fn(),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(false);
      expect(result.fatalErrors).toHaveLength(1);
      // 依赖步骤不应执行（杀死 line 87 if(false) 变异体）
      expect(result.completedSteps).not.toContain('dependentStep');
    });
  });

  describe("isSuccess 内部状态", () => {
    it("应该只在步骤成功时标记为完成", async () => {
      const error = new Error('fail');
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'successStep' }),
        createMockInitStep({
          name: 'failStep',
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'ignorable' as const,
            message: 'Ignorable',
            originalError: error,
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('successStep');
      expect(result.completedSteps).not.toContain('failStep');
    });
  });

  describe("多依赖拓扑排序", () => {
    it("应该在所有依赖完成后才执行步骤（杀死 inDegree 变异体）", async () => {
      const executionOrder: string[] = [];
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'A',
          execute: vi.fn().mockImplementation(async () => { executionOrder.push('A'); }),
        }),
        createMockInitStep({
          name: 'B',
          dependencies: ['A'],
          execute: vi.fn().mockImplementation(async () => { executionOrder.push('B'); }),
        }),
        createMockInitStep({
          name: 'C',
          dependencies: ['A'],
          execute: vi.fn().mockImplementation(async () => { executionOrder.push('C'); }),
        }),
        createMockInitStep({
          name: 'D',
          dependencies: ['B', 'C'],
          execute: vi.fn().mockImplementation(async () => {
            // D 必须在 B 和 C 都完成后执行
            executionOrder.push('D');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      const dIndex = executionOrder.indexOf('D');
      const bIndex = executionOrder.indexOf('B');
      const cIndex = executionOrder.indexOf('C');
      // D 必须在 B 和 C 之后（严格排序验证）
      expect(dIndex).toBeGreaterThan(bIndex);
      expect(dIndex).toBeGreaterThan(cIndex);
      expect(result.completedSteps).toEqual(['A', 'B', 'C', 'D']);
    });
  });

  describe("步骤无依赖时 dependencies 字段", () => {
    it("应该处理 undefined dependencies（杀死 line 221 if(false) 变异体）", async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toEqual(['A', 'B']);
    });

    it("应该处理空数组 dependencies", async () => {
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A', dependencies: [] }),
        createMockInitStep({ name: 'B', dependencies: [] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      expect(result.completedSteps).toHaveLength(2);
    });
  });

  describe("ExecutionContext isSuccess/markSuccess", () => {
    it("应该在步骤成功后通过 context.isSuccess 返回 true", async () => {
      let isSuccessBefore = true;
      let isSuccessAfter = false;
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'step1',
          execute: vi.fn().mockImplementation(async (context) => {
            isSuccessBefore = context.isSuccess('step1');
            return 'result1';
          }),
        }),
        createMockInitStep({
          name: 'step2',
          dependencies: ['step1'],
          execute: vi.fn().mockImplementation(async (context) => {
            isSuccessAfter = context.isSuccess('step1');
            return 'result2';
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      // 执行 step1 前 isSuccess 为 false（杀死 line 32 ??true 变异体）
      expect(isSuccessBefore).toBe(false);
      // step1 成功后 markSuccess 被调用（杀死 line 35/36 BlockStatement/BooleanLiteral 变异体）
      expect(isSuccessAfter).toBe(true);
    });

    it("应该在步骤失败后通过 context.isSuccess 返回 false", async () => {
      let failStepSuccess = true;
      const error = new Error('fail');
      const steps: TestInitStep[] = [
        createMockInitStep({
          name: 'failStep',
          execute: vi.fn().mockRejectedValue(error),
          onError: vi.fn().mockReturnValue({
            severity: 'ignorable' as const,
            message: 'Ignorable',
            originalError: error,
          }),
        }),
        createMockInitStep({
          name: 'checker',
          execute: vi.fn().mockImplementation(async (context) => {
            failStepSuccess = context.isSuccess('failStep');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      // 失败步骤的 isSuccess 应为 false
      expect(failStepSuccess).toBe(false);
    });
  });

  describe("DFS visited 优化", () => {
    it("应该允许已访问节点跳过重复遍历", async () => {
      // A 无依赖，B 和 C 都依赖 A，D 依赖 B 和 C
      // 拓扑排序过程中 A 会被多次引用，但 DFS 只遍历一次
      const steps: TestInitStep[] = [
        createMockInitStep({ name: 'A' }),
        createMockInitStep({ name: 'B', dependencies: ['A'] }),
        createMockInitStep({ name: 'C', dependencies: ['A'] }),
        createMockInitStep({ name: 'D', dependencies: ['B', 'C'] }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      // 验证正确的拓扑排序（A 最先，D 最后）
      expect(result.completedSteps[0]).toBe('A');
      expect(result.completedSteps[3]).toBe('D');
    });
  });

  describe("多依赖 inDegree 精确性", () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it("应该在所有依赖完成后才执行多依赖步骤", async () => {
      // 使用异步延迟确保执行顺序可观察
      const executionOrder: string[] = [];
      const steps: TestInitStep[] = [
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
            await vi.advanceTimersByTimeAsync(10);
            executionOrder.push('B');
          }),
        }),
        createMockInitStep({
          name: 'C',
          dependencies: ['A'],
          execute: vi.fn().mockImplementation(async () => {
            await vi.advanceTimersByTimeAsync(10);
            executionOrder.push('C');
          }),
        }),
        createMockInitStep({
          name: 'D',
          dependencies: ['B', 'C'],
          execute: vi.fn().mockImplementation(async () => {
            // D 必须在 B 和 C 都完成后才能执行
            executionOrder.push('D');
          }),
        }),
      ];

      const result = await manager.runInitialization({ steps: steps as unknown as InitStep[] });

      expect(result.success).toBe(true);
      // D 必须是最后一个执行
      expect(executionOrder.indexOf('D')).toBe(3);
      expect(result.completedSteps).toEqual(['A', 'B', 'C', 'D']);
    });
  });
});

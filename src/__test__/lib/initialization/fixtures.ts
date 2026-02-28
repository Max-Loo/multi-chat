/**
 * 初始化系统测试辅助工具
 *
 * 提供 Mock 数据工厂和测试数据生成函数
 */

import { vi } from 'vitest';
import type { InitStep, InitError, ExecutionContext } from '@/lib/initialization';

/**
 * 创建 Mock 初始化步骤
 * @param overrides 覆盖的步骤属性
 * @returns Mock 初始化步骤
 */
export const createMockInitStep = (
  overrides?: Partial<InitStep>
): InitStep => {
  return {
    name: 'mockStep',
    critical: false,
    execute: vi.fn().mockResolvedValue(undefined),
    onError: vi.fn().mockReturnValue({
      severity: 'warning',
      message: 'Mock error',
    }),
    ...overrides,
  };
};

/**
 * 创建 Mock 初始化错误
 * @param severity 错误严重程度
 * @param message 错误消息
 * @param originalError 原始错误对象
 * @returns Mock 初始化错误
 */
export const createMockInitError = (
  severity: 'fatal' | 'warning' | 'ignorable' = 'warning',
  message?: string,
  originalError?: unknown
): InitError => {
  return {
    severity,
    message: message || 'Mock error message',
    originalError,
  };
};

/**
 * 创建测试用初始化步骤配置
 * @returns 测试用初始化步骤数组
 */
export const createTestInitSteps = (): InitStep[] => {
  return [
    createMockInitStep({
      name: 'step1',
      critical: false,
    }),
    createMockInitStep({
      name: 'step2',
      critical: false,
      dependencies: ['step1'],
    }),
    createMockInitStep({
      name: 'step3',
      critical: false,
      dependencies: ['step1'],
    }),
    createMockInitStep({
      name: 'step4',
      critical: false,
      dependencies: ['step2', 'step3'],
    }),
  ];
};

/**
 * 创建 Mock ExecutionContext
 * @returns Mock 执行上下文
 */
export const createMockExecutionContext = (): ExecutionContext => {
  const results = new Map<string, unknown>();
  const stepStatus = new Map<string, boolean>();

  return {
    getResult: vi.fn((name: string) => results.get(name)) as <T>(name: string) => T | undefined,
    setResult: vi.fn((name: string, value: unknown) => {
      results.set(name, value);
    }),
    isSuccess: vi.fn((name: string) => stepStatus.get(name) ?? false),
  };
};

/**
 * 创建成功执行的步骤
 * @param name 步骤名称
 * @param returnValue 返回值
 * @returns Mock 初始化步骤
 */
export const createSuccessfulStep = (
  name: string,
  returnValue?: unknown
): InitStep => {
  return createMockInitStep({
    name,
    critical: false,
    execute: vi.fn().mockResolvedValue(returnValue),
  });
};

/**
 * 创建失败的步骤
 * @param name 步骤名称
 * @param severity 错误严重程度
 * @param errorMessage 错误消息
 * @returns Mock 初始化步骤
 */
export const createFailingStep = (
  name: string,
  severity: 'fatal' | 'warning' | 'ignorable' = 'warning',
  errorMessage?: string
): InitStep => {
  const error = new Error(errorMessage || 'Step execution failed');

  return createMockInitStep({
    name,
    critical: severity === 'fatal',
    execute: vi.fn().mockRejectedValue(error),
    onError: vi.fn().mockReturnValue({
      severity,
      message: errorMessage || 'Step execution failed',
      originalError: error,
    }),
  });
};

/**
 * 创建带返回值的步骤
 * @param name 步骤名称
 * @param value 返回值
 * @returns Mock 初始化步骤
 */
export const createStepWithValue = <T>(
  name: string,
  value: T
): InitStep => {
  return createMockInitStep({
    name,
    critical: false,
    execute: vi.fn().mockImplementation(async (context: ExecutionContext) => {
      context.setResult(name, value);
      return value;
    }),
  });
};

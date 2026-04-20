/**
 * 初始化系统测试辅助工具
 *
 * 提供 Mock 数据工厂和测试数据生成函数
 */

import { vi } from 'vitest';
import type { InitStep } from '@/services/initialization';

/**
 * 测试用步骤类型，允许任意字符串作为步骤名
 */
export type TestInitStep = Omit<InitStep, 'name' | 'dependencies'> & { name: string; dependencies?: string[] };

/**
 * 创建 Mock 初始化步骤
 * @param overrides 覆盖的步骤属性
 * @returns Mock 初始化步骤
 */
export const createMockInitStep = (
  overrides?: Partial<TestInitStep>
): TestInitStep => {
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

;

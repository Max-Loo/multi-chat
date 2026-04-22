/**
 * Redux 测试 Mock 工厂
 *
 * 提供 Redux 相关功能的 Mock 创建函数
 */

import { vi } from 'vitest';
import { createModelSliceState as _createModelSliceState } from './testState';
import { asTestType } from '@/__test__/helpers/testing-utils';

/**
 * 创建 Mock AbortController
 * @returns AbortController 的 Mock 实现
 */
export const createMockAbortController = () => {
  const mockController = {
    abort: vi.fn(),
    signal: new AbortSignal(),
  };

  return mockController;
};

/**
 * 创建 Mock AbortSignal
 * @param aborted 是否已中止
 * @returns AbortSignal 的 Mock 实现
 */
export const createMockAbortSignal = (aborted = false) => {
  const mockSignal = asTestType<AbortSignal>({
    aborted,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });

  return mockSignal;
};

/**
 * 创建 Model Slice 的预配置状态（统一导出自 testState.ts）
 * @param overrides 要覆盖的状态字段
 * @returns Model slice 状态对象
 */
export const createModelSliceState = _createModelSliceState;

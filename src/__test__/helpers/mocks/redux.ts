/**
 * Redux 测试 Mock 工厂
 *
 * 提供 Redux 相关功能的 Mock 创建函数
 */

import { createModelSliceState as _createModelSliceState } from './testState';

/**
 * 创建 Model Slice 的预配置状态（统一导出自 testState.ts）
 * @param overrides 要覆盖的状态字段
 * @returns Model slice 状态对象
 */
export const createModelSliceState = _createModelSliceState;

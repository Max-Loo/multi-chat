/**
 * modelPageSlices 单元测试
 *
 * 测试 toggleDrawer、setIsDrawerOpen 和初始状态
 */

import { describe, it, expect } from 'vitest';
import modelPageReducer, {
  toggleDrawer,
  setIsDrawerOpen,
} from '@/store/slices/modelPageSlices';

describe('modelPageSlices', () => {
  it('应该初始状态为关闭', () => {
    const state = modelPageReducer(undefined, { type: 'unknown' });
    expect(state.isDrawerOpen).toBe(false);
  });

  it('应该切换状态 当 dispatch toggleDrawer', () => {
    let state = modelPageReducer(undefined, { type: 'unknown' });
    expect(state.isDrawerOpen).toBe(false);

    state = modelPageReducer(state, toggleDrawer());
    expect(state.isDrawerOpen).toBe(true);

    state = modelPageReducer(state, toggleDrawer());
    expect(state.isDrawerOpen).toBe(false);
  });

  it('应该直接设置状态 当 dispatch setIsDrawerOpen', () => {
    let state = modelPageReducer(undefined, { type: 'unknown' });

    state = modelPageReducer(state, setIsDrawerOpen(true));
    expect(state.isDrawerOpen).toBe(true);

    state = modelPageReducer(state, setIsDrawerOpen(false));
    expect(state.isDrawerOpen).toBe(false);
  });
});

/**
 * settingPageSlices 单元测试
 *
 * 测试 toggleDrawer、setIsDrawerOpen 和初始状态
 */

import { describe, it, expect } from 'vitest';
import settingPageReducer, {
  toggleDrawer,
  setIsDrawerOpen,
} from '@/store/slices/settingPageSlices';

describe('settingPageSlices', () => {
  it('应该初始状态为关闭', () => {
    const state = settingPageReducer(undefined, { type: 'unknown' });
    expect(state.isDrawerOpen).toBe(false);
  });

  it('应该切换状态 当 dispatch toggleDrawer', () => {
    let state = settingPageReducer(undefined, { type: 'unknown' });
    expect(state.isDrawerOpen).toBe(false);

    state = settingPageReducer(state, toggleDrawer());
    expect(state.isDrawerOpen).toBe(true);

    state = settingPageReducer(state, toggleDrawer());
    expect(state.isDrawerOpen).toBe(false);
  });

  it('应该直接设置状态 当 dispatch setIsDrawerOpen', () => {
    let state = settingPageReducer(undefined, { type: 'unknown' });

    state = settingPageReducer(state, setIsDrawerOpen(true));
    expect(state.isDrawerOpen).toBe(true);

    state = settingPageReducer(state, setIsDrawerOpen(false));
    expect(state.isDrawerOpen).toBe(false);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import SettingHeader from '@/pages/Setting/components/SettingHeader';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';

// 可变 responsive mock 对象，支持按测试切换 isMobile
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/hooks/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => globalThis.__createScrollbarMock(),
}));

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: { openMenu: '打开菜单', title: '设置' },
}));

/**
 * 渲染 SettingHeader 组件的辅助函数
 */
function renderSettingHeader() {
  return render(
    <Provider store={createTypeSafeTestStore()}>
      <MemoryRouter>
        <SettingHeader />
      </MemoryRouter>
    </Provider>
  );
}

/**
 * SettingHeader 组件单元测试
 *
 * 测试目标：验证移动端菜单按钮渲染和 toggleDrawer dispatch
 */
describe('SettingHeader Component', () => {
  beforeEach(async () => {
    await resetTestState();
    // 默认恢复桌面端
    Object.assign(mockResponsive, { isMobile: false, isDesktop: true });
  });

  describe('移动端渲染', () => {
    it('应该在移动端模式下渲染菜单按钮', () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
      renderSettingHeader();

      expect(screen.getByRole('button', { name: '打开菜单' })).toBeInTheDocument();
    });

    it('应该在桌面端模式下不渲染菜单按钮', () => {
      renderSettingHeader();

      expect(screen.queryByRole('button', { name: '打开菜单' })).not.toBeInTheDocument();
    });
  });

  describe('交互测试', () => {
    it('应该在点击菜单按钮时 dispatch toggleDrawer', () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });
      const store = createTypeSafeTestStore();
      vi.spyOn(store, 'dispatch');

      render(
        <Provider store={store}>
          <MemoryRouter>
            <SettingHeader />
          </MemoryRouter>
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: '打开菜单' }));

      expect(store.dispatch).toHaveBeenCalledTimes(1);
    });
  });
});

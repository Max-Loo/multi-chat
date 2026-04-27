/**
 * ModelHeader 组件测试
 *
 * 测试移动端/桌面端响应式渲染、返回按钮导航、菜单按钮抽屉切换
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModelHeader from '@/pages/Model/CreateModel/components/ModelHeader';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';

/**
 * Mock react-router-dom，捕获 navigate 调用
 */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Mock useResponsive hook，支持切换 isMobile
 */
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

vi.mock(
  'react-i18next',
  () =>
    globalThis.__mockI18n({
      common: { goBack: '返回' },
      model: { openMenu: '打开菜单', title: '模型管理' },
    })
);

describe('ModelHeader 组件', () => {
  const store = createTypeSafeTestStore();

  beforeEach(() => {
    mockNavigate.mockClear();
    mockResponsive.isMobile = false;
    mockResponsive.layoutMode = 'desktop';
    mockResponsive.isDesktop = true;
  });

  /**
   * 渲染 ModelHeader 的辅助函数
   */
  function renderHeader() {
    return renderWithProviders(<ModelHeader />, { store });
  }

  describe('桌面端渲染', () => {
    beforeEach(() => {
      mockResponsive.isMobile = false;
      mockResponsive.layoutMode = 'desktop';
      mockResponsive.isDesktop = true;
    });

    it('应该仅渲染标题，不渲染返回按钮和菜单按钮', () => {
      renderHeader();

      expect(screen.getByText('模型管理')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '返回' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '打开菜单' })).not.toBeInTheDocument();
    });
  });

  describe('移动端渲染与交互', () => {
    beforeEach(() => {
      mockResponsive.isMobile = true;
      mockResponsive.layoutMode = 'mobile';
      mockResponsive.isDesktop = false;
    });

    it('应该渲染返回按钮和菜单按钮', () => {
      renderHeader();

      expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '打开菜单' })).toBeInTheDocument();
    });

    it('点击返回按钮应该导航到 /model/table', async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: '返回' }));

      expect(mockNavigate).toHaveBeenCalledWith('/model/table');
    });

    it('点击菜单按钮应该 dispatch toggleDrawer', async () => {
      const user = userEvent.setup();
      renderHeader();

      await user.click(screen.getByRole('button', { name: '打开菜单' }));

      // toggleDrawer 翻转 isDrawerOpen（初始 false → true）
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);
    });
  });

  describe('重渲染缓存命中', () => {
    it('重渲染时应该使用缓存的组件', () => {
      mockResponsive.isMobile = true;
      mockResponsive.layoutMode = 'mobile';
      mockResponsive.isDesktop = false;

      const { rerender } = renderHeader();

      // 重渲染触发 React Compiler 缓存命中路径
      rerender(
        <ModelHeader />
      );

      expect(screen.getByRole('button', { name: '返回' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '打开菜单' })).toBeInTheDocument();
      expect(screen.getByText('模型管理')).toBeInTheDocument();
    });

    it('桌面端重渲染应该使用缓存', () => {
      mockResponsive.isMobile = false;
      mockResponsive.layoutMode = 'desktop';
      mockResponsive.isDesktop = true;

      const { rerender } = renderHeader();

      rerender(
        <ModelHeader />
      );

      expect(screen.getByText('模型管理')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '返回' })).not.toBeInTheDocument();
    });
  });
});

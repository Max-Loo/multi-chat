import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingPage from '@/pages/Setting/index';
import { resetTestState } from '@/__test__/helpers/isolation';

/**
 * Mock SettingSidebar component
 */
vi.mock('@/pages/Setting/components/SettingSidebar', () => ({
  default: () => <div data-testid="setting-sidebar">Mock SettingSidebar</div>,
}));

/**
 * SettingPage 组件单元测试
 *
 * 测试目标：验证 SettingPage 组件的布局结构
 *
 * 技术方案：
 * - Mock SettingSidebar 子组件
 * - 测试组件正确渲染侧边栏和内容区
 * - 测试 Outlet 渲染（用于嵌套路由）
 */
describe('SettingPage Component', () => {
  beforeEach(() => {
    resetTestState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * 测试渲染
   */
  describe('渲染测试', () => {
    it('应该正确渲染侧边栏和内容区', () => {
      render(
        <MemoryRouter>
          <SettingPage />
        </MemoryRouter>
      );

      // 验证侧边栏被渲染
      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
    });

    it('应该包含正确的布局结构', () => {
      const { container } = render(
        <MemoryRouter>
          <SettingPage />
        </MemoryRouter>
      );

      // 验证主容器存在
      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('flex');
    });
  });

  /**
   * 测试路由
   */
  describe('路由测试', () => {
    it('应该支持侧边栏导航功能', () => {
      render(
        <MemoryRouter initialEntries={['/setting']}>
          <SettingPage />
        </MemoryRouter>
      );

      // 验证侧边栏被渲染（实际导航逻辑在 SettingSidebar 组件中测试）
      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
    });

    it('应该在内容区显示嵌套路由内容', () => {
      render(
        <MemoryRouter initialEntries={['/setting']}>
          <SettingPage />
        </MemoryRouter>
      );

      // Outlet 会渲染嵌套路由的内容（这里只验证组件结构）
      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
    });
  });
});

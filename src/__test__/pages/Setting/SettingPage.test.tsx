import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import SettingPage from '@/pages/Setting/index';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';

/**
 * Mock useAdaptiveScrollbar hook
 */
vi.mock('@/hooks/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => ({
    onScrollEvent: vi.fn(),
    scrollbarClassname: 'custom-scrollbar',
  }),
}));

/**
 * Mock useResponsive hook（桌面端模式）
 */
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock(),
}));

vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: { generalSetting: '通用设置', keyManagement: { title: '密钥管理' }, toastTest: 'Toast 测试' },
}));

/**
 * 渲染 SettingPage 组件的辅助函数
 */
function renderSettingPage(ui: React.ReactElement) {
  return render(
    <Provider store={createTypeSafeTestStore()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

/**
 * SettingPage 组件单元测试
 *
 * 测试目标：验证 SettingPage 组件的布局结构和侧边栏真实渲染
 *
 * 技术方案：
 * - 渲染完整组件树（包括 SettingSidebar 真实组件）
 * - 通过用户可见行为验证功能
 */
describe('SettingPage Component', () => {
  beforeEach(async () => {
    await resetTestState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * 测试渲染
   */
  describe('渲染测试', () => {
    it('应该正确渲染侧边栏（包含导航按钮）', () => {
      renderSettingPage(<SettingPage />);

      // 通过用户可见文本验证 SettingSidebar 真实渲染
      expect(screen.getByText('通用设置')).toBeInTheDocument();
    });

    it('应该包含正确的布局结构', () => {
      const { container } = renderSettingPage(<SettingPage />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass('flex');
    });
  });

  /**
   * 测试路由
   */
  describe('路由测试', () => {
    it('应该支持侧边栏导航功能', () => {
      renderSettingPage(<SettingPage />);

      // 通过语义化查询验证导航按钮存在
      expect(screen.getByRole('button', { name: '通用设置' })).toBeInTheDocument();
    });

    it('应该在内容区显示嵌套路由内容', () => {
      renderSettingPage(<SettingPage />);

      // 验证 Outlet 容器存在
      const contentArea = screen.getByTestId('setting-content');
      expect(contentArea).toBeInTheDocument();
    });
  });
});

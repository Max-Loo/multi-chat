import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import SettingPage from '@/pages/Setting/index';
import { resetTestState } from '@/__test__/helpers/isolation';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';

vi.mock('@/hooks/useAdaptiveScrollbar', () => ({ useAdaptiveScrollbar: () => globalThis.__createScrollbarMock() }));

/**
 * Mock useResponsive hook（桌面端模式）
 */
const mockResponsive = vi.hoisted(() => globalThis.__createResponsiveMock());

vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsive,
}));

vi.mock('react-i18next', () => globalThis.__mockI18n({
  setting: { generalSetting: '通用设置', keyManagement: { title: '密钥管理' }, toastTest: 'Toast 测试' },
}));

const mockNavigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * 渲染 SettingPage 组件的辅助函数
 */
function renderSettingPage(ui: React.ReactElement, initialEntry?: string) {
  return render(
    <Provider store={createTypeSafeTestStore()}>
      <MemoryRouter initialEntries={initialEntry ? [initialEntry] : undefined}>{ui}</MemoryRouter>
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
    mockNavigate.mockClear();
    Object.assign(mockResponsive, { isMobile: false, isDesktop: true });
  });


  /**
   * 测试渲染
   */
  describe('渲染测试', () => {
    it('应该正确渲染侧边栏（包含导航按钮）', () => {
      renderSettingPage(<SettingPage />);

      expect(screen.getByText('通用设置')).toBeInTheDocument();
    });

    it('应该包含正确的布局结构', () => {
      renderSettingPage(<SettingPage />);

      expect(screen.getByRole('navigation', { name: '设置导航' })).toBeInTheDocument();
    });
  });

  /**
   * 测试路由
   */
  describe('路由测试', () => {
    it('应该支持侧边栏导航功能', () => {
      renderSettingPage(<SettingPage />);

      expect(screen.getByRole('button', { name: '通用设置' })).toBeInTheDocument();
    });

    it('应该在内容区显示嵌套路由内容', () => {
      renderSettingPage(<SettingPage />);

      const contentArea = screen.getByTestId('setting-content');
      expect(contentArea).toBeInTheDocument();
    });
  });

  /**
   * SettingSidebar 交互测试
   */
  describe('SettingSidebar 交互测试', () => {
    it('应该在点击设置按钮时触发 navigate', () => {
      renderSettingPage(<SettingPage />, '/setting');

      fireEvent.click(screen.getByRole('button', { name: '通用设置' }));

      expect(mockNavigate).toHaveBeenCalledWith('common');
    });

    it('应该在点击已选中按钮时不触发 navigate（防重复点击）', () => {
      renderSettingPage(<SettingPage />, '/setting/common');

      fireEvent.click(screen.getByRole('button', { name: '通用设置' }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('应该在移动端模式下按钮使用移动端样式', () => {
      Object.assign(mockResponsive, { isMobile: true, isDesktop: false });

      const mobileStore = createTypeSafeTestStore({
        settingPage: { isDrawerOpen: true },
      } as any);

      render(
        <Provider store={mobileStore}>
          <MemoryRouter initialEntries={['/setting/common']}>
            <SettingPage />
          </MemoryRouter>
        </Provider>
      );

      const buttons = screen.getAllByRole('button');
      // 移动端下，通用设置和密钥管理按钮应该包含 h-9 text-sm 类名
      // 排除 SettingHeader 的菜单按钮（h-8 w-8）
      const settingButtons = buttons.filter(
        (btn) => btn.getAttribute('aria-label') !== '打开菜单'
      );
      for (const btn of settingButtons) {
        expect(btn.className).toContain('h-9');
        expect(btn.className).toContain('text-sm');
      }
    });
  });
});

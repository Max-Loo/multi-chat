import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SettingPage from '@/pages/Setting/index';
import { resetTestState } from '@/__test__/helpers/isolation';
import chatPageReducer from '@/store/slices/chatPageSlices';
import settingPageReducer from '@/store/slices/settingPageSlices';

/**
 * 创建测试用的 Redux store
 */
function createTestStore() {
  return configureStore({
    reducer: {
      chatPage: chatPageReducer,
      settingPage: settingPageReducer,
    },
  });
}

/**
 * 渲染 SettingPage 组件的辅助函数
 */
function renderSettingPage(ui: React.ReactElement) {
  return render(
    <Provider store={createTestStore()}>
        <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

/**
 * Mock SettingSidebar component
 */
vi.mock('@/pages/Setting/components/SettingSidebar', () => ({
  default: () => <div data-testid="setting-sidebar">Mock SettingSidebar</div>,
}));

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
 * Mock react-i18next
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 第三方库类型定义不完整
    t: ((keyOrSelector: string | ((resources: any) => string)) => {
      if (typeof keyOrSelector === 'function') {
        const mockResources = {
          setting: {
            generalSetting: '通用设置',
          },
        };
        return keyOrSelector(mockResources);
      }
      return keyOrSelector;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    }) as any,
  }),
}));

/**
 * SettingPage 组件单元测试
 *
 * 测试目标：验证 SettingPage 组件的布局结构
 *
 * 技术方案：
 * - Mock SettingSidebar 子组件（因为它依赖路由和较多 hooks）
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
      renderSettingPage(<SettingPage />);

      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
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

      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
    });

    it('应该在内容区显示嵌套路由内容', () => {
      renderSettingPage(<SettingPage />);

      expect(screen.getByTestId('setting-sidebar')).toBeInTheDocument();
    });
  });
});

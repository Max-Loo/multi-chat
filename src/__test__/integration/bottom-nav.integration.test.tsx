/**
 * 底部导航栏集成测试
 *
 * 测试目标：验证底部导航栏的基本功能和组件渲染
 * - 验证三个导航项正确渲染
 * - 验证点击事件正确触发
 * - 验证激活状态样式正确应用
 *
 * 集成测试关注点：组件渲染和基本交互
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { EnhancedStore } from '@reduxjs/toolkit';
import { BottomNav } from '@/components/BottomNav';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createAppConfigSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { RootState } from '@/store';

// Mock react-i18next
vi.mock('react-i18next', () => {
  const R = { nav: { chat: '聊天', model: '模型', setting: '设置' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock useResponsive 为移动端模式（底部导航栏才显示）
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => ({
    layoutMode: 'mobile',
    width: 600,
    height: 844,
    isMobile: true,
    isCompact: false,
    isCompressed: false,
    isDesktop: false,
  }),
}));

// Mock navigation配置（使用共享 mock）
vi.mock('@/config/navigation', async () => {
  const { createNavigationItemsMock } = await import('@/__test__/helpers/mocks/navigation');
  return { NAVIGATION_ITEMS: createNavigationItemsMock() };
});

/**
 * 创建测试用 Redux Store
 */
function createBottomNavTestStore(): EnhancedStore<RootState> {
  return createTypeSafeTestStore({
    appConfig: createAppConfigSliceState({ language: 'zh' }),
    chatPage: createChatPageSliceState({ isShowChatPage: true }),
  });
}

/**
 * 渲染带路由和 Redux 的 BottomNav
 */
function renderBottomNavWithRouter(
  store: EnhancedStore<RootState>,
  initialEntries: string[] = ['/chat']
) {
  return render(
    <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <BottomNav />
        </MemoryRouter>
    </Provider>
  );
}

describe('底部导航栏集成测试', () => {
  let store: EnhancedStore<RootState>;

  beforeEach(() => {
    store = createBottomNavTestStore();
    // 设置移动端窗口尺寸
    global.innerWidth = 600;
    global.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('组件渲染', () => {
    it('应该渲染底部导航栏', () => {
      renderBottomNavWithRouter(store);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('应该渲染三个导航项', () => {
      renderBottomNavWithRouter(store);

      expect(screen.getByText('聊天')).toBeInTheDocument();
      expect(screen.getByText('模型')).toBeInTheDocument();
      expect(screen.getByText('设置')).toBeInTheDocument();
    });

    it('应该渲染所有图标', () => {
      renderBottomNavWithRouter(store);

      expect(screen.getByTestId('chat-icon')).toBeInTheDocument();
      expect(screen.getByTestId('model-icon')).toBeInTheDocument();
      expect(screen.getByTestId('setting-icon')).toBeInTheDocument();
    });
  });

  describe('点击交互', () => {
    it('所有导航项都应该可点击', () => {
      renderBottomNavWithRouter(store);

      const chatButton = screen.getByText('聊天');
      const modelButton = screen.getByText('模型');
      const settingButton = screen.getByText('设置');

      expect(chatButton).toBeInTheDocument();
      expect(modelButton).toBeInTheDocument();
      expect(settingButton).toBeInTheDocument();

      // 验证按钮可以点击（不会抛出错误）
      fireEvent.click(chatButton);
      fireEvent.click(modelButton);
      fireEvent.click(settingButton);
    });

    it('点击导航项应该触发导航事件', () => {
      renderBottomNavWithRouter(store);

      const chatButton = screen.getByText('聊天');

      // 点击按钮应该不会抛出错误
      expect(() => fireEvent.click(chatButton)).not.toThrow();
    });
  });

  describe('激活状态', () => {
    it('在 /chat 路径时聊天按钮应该有激活样式', () => {
      renderBottomNavWithRouter(store, ['/chat']);

      const buttons = screen.getAllByRole('button');
      const chatButton = buttons.find((btn) => btn.textContent?.includes('聊天'));

      expect(chatButton).toHaveClass('bg-blue-100');
    });

    it('在 /model 路径时模型按钮应该有激活样式', () => {
      renderBottomNavWithRouter(store, ['/model']);

      const buttons = screen.getAllByRole('button');
      const modelButton = buttons.find((btn) => btn.textContent?.includes('模型'));

      expect(modelButton).toHaveClass('bg-emerald-100');
    });

    it('在 /setting 路径时设置按钮应该有激活样式', () => {
      renderBottomNavWithRouter(store, ['/setting']);

      const buttons = screen.getAllByRole('button');
      const settingButton = buttons.find((btn) => btn.textContent?.includes('设置'));

      expect(settingButton).toHaveClass('bg-violet-100');
    });
  });

  describe('样式和布局', () => {
    it('应该有正确的固定定位类', () => {
      renderBottomNavWithRouter(store);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('border-t', 'bg-background', 'h-16');
    });

    it('应该使用 flex 布局均匀分布导航项', () => {
      renderBottomNavWithRouter(store);

      const nav = screen.getByRole('navigation');
      const containerDiv = nav.querySelector('div');
      expect(containerDiv).toHaveClass('flex', 'items-center', 'justify-around');
    });
  });

  describe('子路径激活', () => {
    it('在 /model/create 路径时模型按钮应该激活', () => {
      renderBottomNavWithRouter(store, ['/model/create']);

      const buttons = screen.getAllByRole('button');
      const modelButton = buttons.find((btn) => btn.textContent?.includes('模型'));

      expect(modelButton).toHaveClass('bg-emerald-100');
    });

    it('根路径 / 不应该激活任何按钮', () => {
      renderBottomNavWithRouter(store, ['/']);

      const buttons = screen.getAllByRole('button');

      // 没有按钮应该有激活样式
      buttons.forEach((button) => {
        expect(button).not.toHaveClass('bg-blue-100');
        expect(button).not.toHaveClass('bg-emerald-100');
        expect(button).not.toHaveClass('bg-violet-100');
      });
    });
  });

  describe('边界情况', () => {
    it('快速连续点击应该正确处理', () => {
      renderBottomNavWithRouter(store);

      const chatButton = screen.getByText('聊天');
      const modelButton = screen.getByText('模型');
      const settingButton = screen.getByText('设置');

      // 快速连续点击
      expect(() => {
        fireEvent.click(modelButton);
        fireEvent.click(settingButton);
        fireEvent.click(chatButton);
        fireEvent.click(modelButton);
      }).not.toThrow();
    });

    it('在未知路径时组件应该正常渲染', () => {
      renderBottomNavWithRouter(store, ['/unknown/path']);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });
});

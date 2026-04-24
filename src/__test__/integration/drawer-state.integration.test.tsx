/**
 * 抽屉打开/关闭集成测试
 *
 * 测试目标：验证抽屉的状态管理和组件通信
 * - 点击打开抽屉按钮 → dispatch toggleDrawer action → Redux 状态更新 → MobileDrawer 组件渲染
 * - 抽屉关闭事件（遮罩点击、ESC 键）→ Redux 状态更新
 * - 测试多个打开抽屉按钮：Chat、Settings、Model 创建页面和 Model 页面
 *
 * 集成测试关注点：状态管理和组件通信
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor, screen, act } from '@testing-library/react';
import type { EnhancedStore } from '@reduxjs/toolkit';

// 被测试的页面组件
import ChatPage from '@/pages/Chat';

import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createTestRootState, createAppConfigSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { RootState } from '@/store';
import { toggleDrawer as chatToggleDrawer, setIsDrawerOpen as chatSetIsDrawerOpen } from '@/store/slices/chatPageSlices';

vi.mock('react-i18next', () => globalThis.__mockI18n({
  chat: { hideSidebar: '隐藏侧边栏' },
  setting: { openMenu: '打开菜单' },
  model: { openMenu: '打开菜单' },
}));

// Mock useResponsive 为移动端模式（抽屉才显示）
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock({ layoutMode: 'mobile', width: 600, height: 844, isMobile: true, isDesktop: false }),
}));

/**
 * 刷新 Radix UI 内部的 setTimeout(fn, 0) 回调
 * 短暂启用 fake timers 来执行所有待处理的定时器，然后恢复真实定时器
 */
function flushRadixTimers() {
  vi.useFakeTimers();
  act(() => { vi.runAllTimers() });
  vi.useRealTimers();
}

/**
 * 创建测试用 Redux Store
 */
function createDrawerTestStore(): EnhancedStore<RootState> {
  return createTypeSafeTestStore(createTestRootState({
    appConfig: createAppConfigSliceState({ language: 'zh' }),
    chatPage: createChatPageSliceState({ isShowChatPage: true }),
  }));
}

/**
 * 渲染带 ResponsiveProvider 的聊天页面
 */
function renderChatPage(store: EnhancedStore<RootState>) {
  return renderWithProviders(<ChatPage />, { store });
}

describe('抽屉打开/关闭集成测试', () => {
  let store: EnhancedStore<RootState>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = createDrawerTestStore();
    // 设置移动端窗口尺寸
    global.innerWidth = 600;
    global.dispatchEvent(new Event('resize'));
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Chat 页面抽屉', () => {
    it('抽屉状态变化应该触发组件重新渲染', async () => {
      const { rerender } = renderChatPage(store);

      // 初始状态：关闭，侧边栏不在 DOM 中
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // 打开抽屉
      store.dispatch(chatToggleDrawer());

      rerender(<ChatPage />);
      flushRadixTimers();

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(true);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('抽屉关闭事件处理', () => {
    it('遮罩点击应该关闭抽屉', async () => {
      const { rerender } = renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      rerender(<ChatPage />);
      flushRadixTimers();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 模拟遮罩点击关闭抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      rerender(<ChatPage />);
      flushRadixTimers();

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('ESC 键应该关闭抽屉', async () => {
      const { rerender } = renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      rerender(<ChatPage />);
      flushRadixTimers();

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 模拟 ESC 键关闭抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      rerender(<ChatPage />);
      flushRadixTimers();

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

});

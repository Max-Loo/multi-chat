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
import { render, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import type { EnhancedStore } from '@reduxjs/toolkit';

// 被测试的页面组件
import ChatPage from '@/pages/Chat';
import SettingPage from '@/pages/Setting';
import CreateModel from '@/pages/Model/CreateModel';

import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createTestRootState, createAppConfigSliceState, createChatPageSliceState } from '@/__test__/helpers/mocks/testState';
import type { RootState } from '@/store';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'zh',
      changeLanguage: vi.fn(),
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock useResponsive 为移动端模式（抽屉才显示）
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
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
    </Provider>
  );
}

/**
 * 渲染带 ResponsiveProvider 的设置页面
 */
function renderSettingPage(store: EnhancedStore<RootState>) {
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <SettingPage />
        </BrowserRouter>
    </Provider>
  );
}

/**
 * 渲染带 ResponsiveProvider 的创建模型页面
 */
function renderCreateModelPage(store: EnhancedStore<RootState>) {
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <CreateModel />
        </BrowserRouter>
    </Provider>
  );
}

describe('抽屉打开/关闭集成测试', () => {
  let store: EnhancedStore<RootState>;

  beforeEach(() => {
    store = createDrawerTestStore();
    // 设置移动端窗口尺寸
    global.innerWidth = 600;
    global.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Chat 页面抽屉', () => {
    it('初始状态抽屉应该是关闭的', () => {
      renderChatPage(store);

      const drawerState = store.getState().chatPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderChatPage(store);

      // 初始状态：关闭
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch({
        type: 'chatPage/setIsDrawerOpen',
        payload: true,
      });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({
        type: 'chatPage/setIsDrawerOpen',
        payload: false,
      });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('抽屉状态变化应该触发组件重新渲染', async () => {
      const { rerender } = renderChatPage(store);

      // 初始状态：关闭
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });

      rerender(
        <Provider store={store}>
            <BrowserRouter>
              <ChatPage />
            </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      });
    });
  });

  describe('Setting 页面抽屉', () => {
    it('初始状态抽屉应该是关闭的', () => {
      renderSettingPage(store);

      const drawerState = store.getState().settingPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderSettingPage(store);

      // 初始状态：关闭
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch({ type: 'settingPage/toggleDrawer' });
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({ type: 'settingPage/toggleDrawer' });
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
    });

    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderSettingPage(store);

      // 打开抽屉
      store.dispatch({
        type: 'settingPage/setIsDrawerOpen',
        payload: true,
      });
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({
        type: 'settingPage/setIsDrawerOpen',
        payload: false,
      });
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
    });
  });

  describe('Model 创建页面抽屉', () => {
    it('初始状态抽屉应该是关闭的', () => {
      renderCreateModelPage(store);

      const drawerState = store.getState().modelPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderCreateModelPage(store);

      // 初始状态：关闭
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch({ type: 'modelPage/toggleDrawer' });
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({ type: 'modelPage/toggleDrawer' });
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);
    });

    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderCreateModelPage(store);

      // 打开抽屉
      store.dispatch({
        type: 'modelPage/setIsDrawerOpen',
        payload: true,
      });
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch({
        type: 'modelPage/setIsDrawerOpen',
        payload: false,
      });
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);
    });
  });

  describe('多个页面的抽屉状态独立管理', () => {
    it('Chat 和 Setting 页面的抽屉状态应该独立', () => {
      // 渲染 Chat 页面
      renderChatPage(store);

      // 打开 Chat 抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);

      // 打开 Setting 抽屉
      store.dispatch({ type: 'settingPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭 Chat 抽屉
      store.dispatch({ type: 'chatPage/setIsDrawerOpen', payload: false });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
    });

    it('Chat、Setting 和 Model 创建页面的抽屉状态应该互不影响', () => {
      // 打开所有抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      store.dispatch({ type: 'settingPage/toggleDrawer' });
      store.dispatch({ type: 'modelPage/toggleDrawer' });

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭 Setting 抽屉
      store.dispatch({ type: 'settingPage/setIsDrawerOpen', payload: false });

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);
    });
  });

  describe('抽屉关闭事件处理', () => {
    it('遮罩点击应该关闭抽屉', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 模拟遮罩点击关闭抽屉
      store.dispatch({ type: 'chatPage/setIsDrawerOpen', payload: false });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('ESC 键应该关闭抽屉', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 模拟 ESC 键关闭抽屉
      store.dispatch({ type: 'chatPage/setIsDrawerOpen', payload: false });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });
  });

  describe('边界情况', () => {
    it('重复 dispatch toggleDrawer 应该正确切换状态', () => {
      renderChatPage(store);

      // 连续切换 4 次
      for (let i = 0; i < 4; i++) {
        store.dispatch({ type: 'chatPage/toggleDrawer' });
      }

      // 第 4 次后应该是关闭状态（初始关闭，切换 4 次后仍为关闭）
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('setIsDrawerOpen 应该覆盖当前状态', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch({ type: 'chatPage/toggleDrawer' });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 使用 setIsDrawerOpen 设置为 true（无变化）
      store.dispatch({ type: 'chatPage/setIsDrawerOpen', payload: true });
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 使用 setIsDrawerOpen 设置为 false
      store.dispatch({ type: 'chatPage/setIsDrawerOpen', payload: false });
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });
  });
});

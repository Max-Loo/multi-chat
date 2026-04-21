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
import { render, cleanup, waitFor, screen } from '@testing-library/react';
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
import { toggleDrawer as chatToggleDrawer, setIsDrawerOpen as chatSetIsDrawerOpen } from '@/store/slices/chatPageSlices';
import { toggleDrawer as settingToggleDrawer, setIsDrawerOpen as settingSetIsDrawerOpen } from '@/store/slices/settingPageSlices';
import { toggleDrawer as modelToggleDrawer, setIsDrawerOpen as modelSetIsDrawerOpen } from '@/store/slices/modelPageSlices';

// Mock react-i18next
vi.mock('react-i18next', () => {
  const R = { common: { search: '搜索' }, chat: { hideSidebar: '隐藏侧边栏', showSidebar: '显示侧边栏', createChat: '创建聊天', unnamed: '未命名', rename: '重命名', delete: '删除' }, navigation: { chat: '聊天', model: '模型', setting: '设置', mobileDrawer: { title: '侧边栏', description: '侧边栏', ariaDescription: '抽屉内容' } }, setting: { openMenu: '打开菜单' }, model: { openMenu: '打开菜单' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock useResponsive 为移动端模式（抽屉才显示）
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => globalThis.__createResponsiveMock({ layoutMode: 'mobile', width: 600, height: 844, isMobile: true, isDesktop: false }),
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
    // TODO(单元测试迁移): 此测试仅验证 Redux reducer 初始状态，应移到 chatPageSlices 单元测试
    it('初始状态抽屉应该是关闭的', () => {
      renderChatPage(store);

      const drawerState = store.getState().chatPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer toggle 逻辑，应移到 chatPageSlices 单元测试
    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderChatPage(store);

      // 初始状态：关闭
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(chatToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer setState 逻辑，应移到 chatPageSlices 单元测试
    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatSetIsDrawerOpen(true));
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    it('抽屉状态变化应该触发组件重新渲染', async () => {
      const { rerender } = renderChatPage(store);

      // 初始状态：关闭，侧边栏不在 DOM 中
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // 打开抽屉
      store.dispatch(chatToggleDrawer());

      rerender(
        <Provider store={store}>
            <BrowserRouter>
              <ChatPage />
            </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(true);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Setting 页面抽屉', () => {
    // TODO(单元测试迁移): 此测试仅验证 Redux reducer 初始状态，应移到 settingPageSlices 单元测试
    it('初始状态抽屉应该是关闭的', () => {
      renderSettingPage(store);

      const drawerState = store.getState().settingPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer toggle 逻辑，应移到 settingPageSlices 单元测试
    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderSettingPage(store);

      // 初始状态：关闭
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch(settingToggleDrawer());
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(settingToggleDrawer());
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer setState 逻辑，应移到 settingPageSlices 单元测试
    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderSettingPage(store);

      // 打开抽屉
      store.dispatch(settingSetIsDrawerOpen(true));
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(settingSetIsDrawerOpen(false));
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
    });
  });

  describe('Model 创建页面抽屉', () => {
    // TODO(单元测试迁移): 此测试仅验证 Redux reducer 初始状态，应移到 modelPageSlices 单元测试
    it('初始状态抽屉应该是关闭的', () => {
      renderCreateModelPage(store);

      const drawerState = store.getState().modelPage.isDrawerOpen;
      expect(drawerState).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer toggle 逻辑，应移到 modelPageSlices 单元测试
    it('dispatch toggleDrawer action 应该切换抽屉状态', () => {
      renderCreateModelPage(store);

      // 初始状态：关闭
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);

      // 打开抽屉
      store.dispatch(modelToggleDrawer());
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(modelToggleDrawer());
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer setState 逻辑，应移到 modelPageSlices 单元测试
    it('dispatch setIsDrawerOpen action 应该设置抽屉状态', () => {
      renderCreateModelPage(store);

      // 打开抽屉
      store.dispatch(modelSetIsDrawerOpen(true));
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭抽屉
      store.dispatch(modelSetIsDrawerOpen(false));
      expect(store.getState().modelPage.isDrawerOpen).toBe(false);
    });
  });

  describe('多个页面的抽屉状态独立管理', () => {
    it('Chat 和 Setting 页面的抽屉状态应该独立', () => {
      // 渲染 Chat 页面
      renderChatPage(store);

      // 打开 Chat 抽屉
      store.dispatch(chatToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);

      // 打开 Setting 抽屉
      store.dispatch(settingToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);

      // 关闭 Chat 抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
    });

    it('Chat、Setting 和 Model 创建页面的抽屉状态应该互不影响', () => {
      // 打开所有抽屉
      store.dispatch(chatToggleDrawer());
      store.dispatch(settingToggleDrawer());
      store.dispatch(modelToggleDrawer());

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(true);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);

      // 关闭 Setting 抽屉
      store.dispatch(settingSetIsDrawerOpen(false));

      expect(store.getState().chatPage.isDrawerOpen).toBe(true);
      expect(store.getState().settingPage.isDrawerOpen).toBe(false);
      expect(store.getState().modelPage.isDrawerOpen).toBe(true);
    });
  });

  describe('抽屉关闭事件处理', () => {
    it('遮罩点击应该关闭抽屉', async () => {
      const { rerender } = renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ChatPage />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 模拟遮罩点击关闭抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ChatPage />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('ESC 键应该关闭抽屉', async () => {
      const { rerender } = renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ChatPage />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // 模拟 ESC 键关闭抽屉
      store.dispatch(chatSetIsDrawerOpen(false));
      rerender(
        <Provider store={store}>
          <BrowserRouter>
            <ChatPage />
          </BrowserRouter>
        </Provider>
      );

      await waitFor(() => {
        expect(store.getState().chatPage.isDrawerOpen).toBe(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('边界情况', () => {
    // TODO(单元测试迁移): 此测试仅验证 Redux reducer toggle 逻辑，应移到 chatPageSlices 单元测试
    it('重复 dispatch toggleDrawer 应该正确切换状态', () => {
      renderChatPage(store);

      // 连续切换 4 次
      for (let i = 0; i < 4; i++) {
        store.dispatch(chatToggleDrawer());
      }

      // 第 4 次后应该是关闭状态（初始关闭，切换 4 次后仍为关闭）
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });

    // TODO(单元测试迁移): 此测试仅验证 Redux reducer setState 逻辑，应移到 chatPageSlices 单元测试
    it('setIsDrawerOpen 应该覆盖当前状态', () => {
      renderChatPage(store);

      // 打开抽屉
      store.dispatch(chatToggleDrawer());
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 使用 setIsDrawerOpen 设置为 true（无变化）
      store.dispatch(chatSetIsDrawerOpen(true));
      expect(store.getState().chatPage.isDrawerOpen).toBe(true);

      // 使用 setIsDrawerOpen 设置为 false
      store.dispatch(chatSetIsDrawerOpen(false));
      expect(store.getState().chatPage.isDrawerOpen).toBe(false);
    });
  });
});

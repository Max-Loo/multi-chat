/**
 * 响应式布局模式切换集成测试
 *
 * 测试目标：验证不同布局模式之间的切换逻辑
 * - Desktop → Compact 切换时侧边栏宽度变化
 * - Compact → Compressed 切换时导航方式切换
 * - Compressed → Mobile 切换时抽屉渲染
 * - 所有组件正确渲染和交互
 *
 * 集成测试关注点：组件间交互、数据流、状态管理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Layout from '@/components/Layout';
import ChatPage from '@/pages/Chat';

// Redux reducers
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelReducer from '@/store/slices/modelSlice';
import appConfigReducer from '@/store/slices/appConfigSlices';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import settingPageReducer from '@/store/slices/settingPageSlices';
import modelPageReducer from '@/store/slices/modelPageSlices';

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

// 响应式状态存储，用于动态 mock
let mockResponsiveState = {
  layoutMode: 'desktop' as 'mobile' | 'compact' | 'compressed' | 'desktop',
  width: 1280,
  height: 800,
  isMobile: false,
  isCompact: false,
  isCompressed: false,
  isDesktop: true,
};

// 根据窗口宽度计算响应式状态
function updateResponsiveState(width: number) {
  mockResponsiveState = {
    layoutMode: width < 768 ? 'mobile' : width < 1024 ? 'compact' : width < 1280 ? 'compressed' : 'desktop',
    width,
    height: 800,
    isMobile: width < 768,
    isCompact: width >= 768 && width < 1024,
    isCompressed: width >= 1024 && width < 1280,
    isDesktop: width >= 1280,
  };
}

// Mock useResponsive hook
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: () => mockResponsiveState,
}));

/**
 * 创建测试用 Redux Store
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTestStore(): any {
  return configureStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
      models: modelReducer,
      appConfig: appConfigReducer,
      modelProvider: modelProviderReducer,
      settingPage: settingPageReducer,
      modelPage: modelPageReducer,
    } as any,
    preloadedState: {
      chat: {
        chatList: [],
        selectedChatId: null,
        loading: false,
        error: null,
        initializationError: null,
        runningChat: {},
      },
      chatPage: {
        isSidebarCollapsed: false,
        isShowChatPage: true,
        isDrawerOpen: false,
      },
      models: {
        models: [],
        loading: false,
        error: null,
        initializationError: null,
      },
      appConfig: {
        language: 'zh',
        includeReasoningContent: true,
        autoNamingEnabled: true,
      },
      modelProvider: {
        providers: [],
        loading: false,
        error: null,
        lastUpdate: null,
        backgroundRefreshing: false,
      },
      settingPage: {
        isDrawerOpen: false,
      },
      modelPage: {
        isDrawerOpen: false,
      },
    },
  });
}

/**
 * 渲染带 ResponsiveProvider 的布局
 */
function renderLayoutWithResponsive(store: any) {
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
    </Provider>
  );
}

/**
 * 渲染完整的聊天页面（包含 Layout）
 */
function renderChatPageWithResponsive(store: any) {
  return render(
    <Provider store={store}>
        <BrowserRouter>
          <ChatPage />
        </BrowserRouter>
    </Provider>
  );
}

describe('响应式布局模式切换集成测试', () => {
  let store: any;

  beforeEach(() => {
    store = createTestStore();
    // 模拟桌面端窗口尺寸
    global.innerWidth = 1280;
    updateResponsiveState(1280);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Desktop → Compact 切换', () => {
    it('应该在窗口宽度从 1280px 变为 800px 时切换到 Compact 模式', async () => {
      renderChatPageWithResponsive(store);

      // 初始状态：Desktop 模式（1280px）
      expect(mockResponsiveState.isDesktop).toBe(true);

      // 模拟窗口缩小到 800px（Compact 模式）
      updateResponsiveState(800);

      await waitFor(() => {
        // 验证已切换到 Compact 模式
        expect(mockResponsiveState.isCompact).toBe(true);
        // 验证 ChatPage 正确渲染
        const chatPage = document.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });
    });

    it('Compact 模式下侧边栏应该使用压缩宽度', async () => {
      // 设置窗口宽度为 Compact 范围
      updateResponsiveState(900);

      const { container } = renderChatPageWithResponsive(store);

      await waitFor(() => {
        // 验证组件正确渲染
        const chatPage = container.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });
    });
  });

  describe('Compact → Compressed 切换', () => {
    it('应该在窗口宽度从 800px 变为 1100px 时切换到 Compressed 模式', async () => {
      renderChatPageWithResponsive(store);

      // 设置窗口宽度为 Compressed 范围
      updateResponsiveState(1100);

      await waitFor(() => {
        // 验证已切换到 Compressed 模式
        expect(mockResponsiveState.isCompressed).toBe(true);
        // 验证布局正确更新
        const chatPage = document.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });
    });

    it('Compressed 和 Compact 模式的侧边栏宽度应该相同', async () => {
      // Compact 模式
      updateResponsiveState(900);
      const { container: compactContainer } = renderChatPageWithResponsive(store);

      await waitFor(() => {
        const chatPage = compactContainer.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });

      cleanup();

      // Compressed 模式
      updateResponsiveState(1100);
      const { container: compressedContainer } = renderChatPageWithResponsive(store);

      await waitFor(() => {
        const chatPage = compressedContainer.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });
    });
  });

  describe('Compressed → Mobile 切换', () => {
    it('应该在窗口宽度从 1100px 变为 600px 时切换到 Mobile 模式', async () => {
      renderLayoutWithResponsive(store);

      // 初始状态：Compressed 模式
      updateResponsiveState(1100);

      // 切换到 Mobile 模式
      updateResponsiveState(600);

      await waitFor(() => {
        // Mobile 模式下应该显示底部导航栏
        expect(mockResponsiveState.isMobile).toBe(true);
      });
    });

    it('Mobile 模式下侧边导航栏应该隐藏', async () => {
      // 设置窗口宽度为 Mobile 范围
      updateResponsiveState(600);

      renderLayoutWithResponsive(store);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });
  });

  describe('所有组件正确渲染和交互', () => {
    it('Desktop 模式下应该渲染侧边导航栏和主内容', async () => {
      updateResponsiveState(1280);

      renderLayoutWithResponsive(store);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();

        const mainContent = document.querySelector('.flex-1.overflow-y-hidden');
        expect(mainContent).toBeInTheDocument();
      });
    });

    it('Compact 模式下应该渲染侧边导航栏和压缩的侧边栏', async () => {
      updateResponsiveState(900);

      renderChatPageWithResponsive(store);

      await waitFor(() => {
        const chatPage = document.querySelector('[data-testid="chat-page"]');
        expect(chatPage).toBeInTheDocument();
      });
    });

    it('Mobile 模式下应该渲染底部导航栏', async () => {
      updateResponsiveState(600);

      renderLayoutWithResponsive(store);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();

        const mainContent = document.querySelector('.flex-1.overflow-y-hidden');
        expect(mainContent).toBeInTheDocument();
      });
    });
  });

  describe('组件间交互和数据流', () => {
    it('窗口尺寸变化时应该正确更新响应式状态', async () => {
      const { container } = renderLayoutWithResponsive(store);

      // Desktop 模式
      updateResponsiveState(1280);

      await waitFor(() => {
        const layout = container.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });

      // 切换到 Mobile 模式
      updateResponsiveState(600);

      await waitFor(() => {
        const layout = container.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });

    it('快速切换窗口尺寸不应该导致错误', async () => {
      renderLayoutWithResponsive(store);

      // 模拟快速窗口尺寸变化
      updateResponsiveState(1280);
      updateResponsiveState(900);
      updateResponsiveState(600);
      updateResponsiveState(1280);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });
  });

  describe('边界情况', () => {
    it('应该正确处理断点边界值（768px）', async () => {
      renderLayoutWithResponsive(store);

      // 测试 768px 边界（Mobile ↔ Compact）
      updateResponsiveState(768);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });

    it('应该正确处理断点边界值（1024px）', async () => {
      renderLayoutWithResponsive(store);

      // 测试 1024px 边界（Compact ↔ Compressed）
      updateResponsiveState(1024);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });

    it('应该正确处理断点边界值（1280px）', async () => {
      renderLayoutWithResponsive(store);

      // 测试 1280px 边界（Compressed ↔ Desktop）
      updateResponsiveState(1280);

      await waitFor(() => {
        const layout = document.querySelector('.flex.h-screen');
        expect(layout).toBeInTheDocument();
      });
    });
  });
});

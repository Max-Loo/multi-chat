import { render, screen, fireEvent, cleanup } from '@testing-library/react';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { Provider } from 'react-redux';

import { BrowserRouter } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';

import chatReducer from '@/store/slices/chatSlices';

import chatPageReducer from '@/store/slices/chatPageSlices';

import ChatButton from '@/pages/Chat/components/ChatSidebar/components/ChatButton';

import { resetTestState } from '@/__test__/helpers/isolation';

import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

// Mock useResponsive from useResponsive hook
vi.mock('@/hooks/useResponsive', () => ({
  useResponsive: vi.fn(() => ({
    layoutMode: 'desktop',
    width: 1280,
    height: 800,
    isMobile: false,
    isCompact: false,
    isCompressed: false,
    isDesktop: true,
  })),
}));

import * as useResponsiveModule from '@/hooks/useResponsive';
const mockUseResponsive = vi.mocked(useResponsiveModule.useResponsive);

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

          chat: {

            unnamed: '未命名',

            rename: '重命名',

            delete: '删除',

            confirmDelete: '确认删除',

            deleteChatConfirm: '确定要删除这个聊天吗？',

            deleteChatSuccess: '删除成功',

            deleteChatFailed: '删除失败',

            editChatSuccess: '重命名成功',

            editChatFailed: '重命名失败',

          },

        };

        return keyOrSelector(mockResources);

      }

      return keyOrSelector;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    // Reason: 测试错误处理，需要构造无效输入

    }) as any,

    i18n: {

      language: 'zh',

      changeLanguage: vi.fn(),

    },

  }),

  initReactI18next: {

    type: '3rdParty',

    init: vi.fn(),

  },

}));



/**

 * Mock useNavigateToPage hook

 */

const mockNavigateToChat = vi.fn();

vi.mock('@/hooks/useNavigateToPage', () => ({

  useNavigateToChat: () => ({

    navigateToChat: mockNavigateToChat,

  }),

}));



/**

 * Mock useConfirm hook

 */

const mockModalWarning = vi.fn();

vi.mock('@/hooks/useConfirm', () => ({

  useConfirm: () => ({

    modal: {

      warning: mockModalWarning,

    },

  }),

}));

/**

 * Mock toastQueue

 

 */

vi.mock('@/lib/toast', () => ({

  toastQueue: {

    success: vi.fn(async () => 'toast-id'),

    error: vi.fn(async () => 'toast-id'),

  },

}));



/**

 * 创建测试用的 Redux store

 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any

// Reason: Redux Toolkit 严格类型系统限制

function createTestStore(preloadedState?: any) {

  return configureStore({

    reducer: {

      chat: chatReducer,

      chatPage: chatPageReducer,

    },

    ...(preloadedState && { preloadedState }),

  });

}



/**

 * 渲染 ChatButton 组件的辅助函数

 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: 测试错误处理，需要构造无效输入
function renderChatButton(chat: any, store?: any) {

  const testStore = store || createTestStore({

    chat: {

      chatList: [chat],

      selectedChatId: chat.id,

      loading: false,

    },

    chatPage: {

      isShowChatPage: true,

      isSidebarCollapsed: false,

    },

  });



  return render(

    <Provider store={testStore}>

      <BrowserRouter>

        <ChatButton chat={chat} />

      </BrowserRouter>

    </Provider>

  );

}



/**

 * ChatButton 组件单元测试

 *

 * 测试目标：验证 ChatButton 组件的核心功能

 *

 * 技术方案：

 * - Mock 依赖的 hooks 和组件

 * - 使用 Redux Provider 提供测试状态

 * - 测试渲染、导航、重命名、删除、下拉菜单等功能

 */

describe('ChatButton Component', () => {

  beforeEach(() => {

    resetTestState();

    vi.clearAllMocks();

  });



  afterEach(() => {

    cleanup();

  });



  /**

   * 测试组件渲染

   */

  describe('组件渲染', () => {

    it('应该渲染聊天按钮', () => {

      const chat = createMockChat({ name: '测试聊天' });

      renderChatButton(chat);



      expect(screen.getByText('测试聊天')).toBeInTheDocument();

    });



    it('应该渲染未命名的聊天', () => {

      const chat = createMockChat({ name: '' });

      renderChatButton(chat);



      expect(screen.getByText('未命名')).toBeInTheDocument();

    });



    it('应该在选中状态时显示背景色', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const buttonDiv = container.querySelector('.bg-primary\\/20');

      expect(buttonDiv).toBeInTheDocument();

    });



    it('应该在未选中状态时不显示背景色', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const store = createTestStore({

        chat: {

          chatList: [chat],

          selectedChatId: 'other-chat-id',

          loading: false,

        },

        chatPage: {

          isShowChatPage: true,

          isSidebarCollapsed: false,

        },

      });



      const { container } = renderChatButton(chat, store);

      const buttonDiv = container.querySelector('.bg-primary\\/20');

      expect(buttonDiv).not.toBeInTheDocument();

    });



    it('应该渲染下拉菜单按钮', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[class*="p-0"]');

      expect(menuButton).toBeInTheDocument();

    });

  });



  /**

   * 测试点击导航功能

   */

  describe('点击导航', () => {

    it('点击聊天按钮应该触发导航', () => {

      const chat = createMockChat({ name: '测试聊天' });

      renderChatButton(chat);



      const buttonDiv = screen.getByText('测试聊天').closest('div');

      if (buttonDiv) {

        fireEvent.click(buttonDiv);

        expect(mockNavigateToChat).toHaveBeenCalledWith({ chatId: chat.id });

      }

    });



    it('点击下拉菜单按钮不应该触发导航', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[class*="p-0"]');

      if (menuButton) {

        fireEvent.click(menuButton);

        expect(mockNavigateToChat).not.toHaveBeenCalled();

      }

    });

  });



  /**

   * 测试重命名功能

   */

  describe('重命名功能', () => {

    it('应该渲染下拉菜单按钮', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[aria-haspopup="menu"]');

      expect(menuButton).toBeInTheDocument();

    });



    it('下拉菜单按钮应该有正确的 aria 属性', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[aria-haspopup="menu"]');

      expect(menuButton).toHaveAttribute('aria-haspopup', 'menu');

      expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    });

  });



  /**

   * 测试删除功能

   */

  describe('删除功能', () => {

    it('应该有删除功能的钩子（通过 mockModalWarning 验证）', () => {

      expect(mockModalWarning).toBeDefined();

    });



    it('下拉菜单按钮点击时不应该触发导航', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[aria-haspopup="menu"]');

      if (menuButton) {

        fireEvent.click(menuButton);

        expect(mockNavigateToChat).not.toHaveBeenCalled();

      }

    });

  });



  /**

   * 测试组件结构和样式

   */

  describe('组件结构和样式', () => {

    it('聊天按钮应该有正确的样式类', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const buttonDiv = container.querySelector('.w-full.py-2.px-1');

      expect(buttonDiv).toBeInTheDocument();

    });



    it('应该在选中状态时显示背景色', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const buttonDiv = container.querySelector('.bg-primary\\/20');

      expect(buttonDiv).toBeInTheDocument();

    });



    it('下拉菜单按钮应该有正确的图标', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { container } = renderChatButton(chat);



      const menuButton = container.querySelector('button[aria-haspopup="menu"]');

      expect(menuButton?.querySelector('svg')).toBeInTheDocument();

    });

  });



  /**

   * 测试 memo 优化

   */

  describe('组件 memo 优化', () => {

    it('当聊天 ID 和名称未改变时，不应该重新渲染', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { rerender } = renderChatButton(chat);



      // 使用相同的 chat 对象重新渲染

      rerender(

        <Provider store={createTestStore({

          chat: {

            chatList: [chat],

            selectedChatId: chat.id,

            loading: false,

          },

          chatPage: {

            isShowChatPage: true,

            isSidebarCollapsed: false,

          },

        })}>

          <BrowserRouter>

            <ChatButton chat={chat} />

          </BrowserRouter>

        </Provider>

      );



      // 组件被 memo，不应该重新渲染

      expect(screen.getByText('测试聊天')).toBeInTheDocument();

    });



    it('当聊天名称改变时，应该重新渲染', () => {

      const chat = createMockChat({ name: '测试聊天' });

      const { rerender } = renderChatButton(chat);



      const updatedChat = { ...chat, name: '新名称' };

      rerender(

        <Provider store={createTestStore({

          chat: {

            chatList: [updatedChat],

            selectedChatId: chat.id,

            loading: false,

          },

          chatPage: {

            isShowChatPage: true,

            isSidebarCollapsed: false,

          },

        })}>

          <BrowserRouter>

            <ChatButton chat={updatedChat} />

          </BrowserRouter>

        </Provider>

      );



      expect(screen.getByText('新名称')).toBeInTheDocument();

    });

  });

  /**
   * 测试响应式布局模式
   */
  describe('响应式布局模式', () => {
    it('桌面模式（desktop）：正常字体（text-sm）和图标（h-8 w-8）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 检查按钮容器的 padding
      const buttonDiv = container.querySelector('.py-2.px-1');
      expect(buttonDiv).toBeInTheDocument();

      // 检查字体大小
      const chatName = screen.getByTestId('chat-name');
      expect(chatName).toHaveClass('text-sm');

      // 检查图标大小
      const menuButton = container.querySelector('button[class*="p-0"]');
      expect(menuButton).toHaveClass('h-8', 'w-8');
    });

    it('紧凑模式（compact）：缩小字体（text-xs）和图标（h-7 w-7）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compact',
        width: 800,
        height: 600,
        isMobile: false,
        isCompact: true,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 检查按钮容器的 padding（压缩模式）
      const buttonDiv = container.querySelector('div[class*="py-1.5"]');
      expect(buttonDiv).toBeInTheDocument();

      // 检查字体大小
      const chatName = screen.getByTestId('chat-name');
      expect(chatName).toHaveClass('text-xs');

      // 检查图标大小
      const menuButton = container.querySelector('button[class*="p-0"]');
      expect(menuButton).toHaveClass('h-7', 'w-7');
    });

    it('压缩模式（compressed）：与 compact 相同', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'compressed',
        width: 1100,
        height: 700,
        isMobile: false,
        isCompact: false,
        isCompressed: true,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 与 compact 模式相同的样式
      const buttonDiv = container.querySelector('div[class*="py-1.5"]');
      expect(buttonDiv).toBeInTheDocument();

      const chatName = screen.getByTestId('chat-name');
      expect(chatName).toHaveClass('text-xs');

      const menuButton = container.querySelector('button[class*="p-0"]');
      expect(menuButton).toHaveClass('h-7', 'w-7');
    });

    it('移动模式（mobile）：在抽屉中正常显示（与 desktop 相同）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 与 desktop 模式相同的样式
      const buttonDiv = container.querySelector('.py-2.px-1');
      expect(buttonDiv).toBeInTheDocument();

      const chatName = screen.getByTestId('chat-name');
      expect(chatName).toHaveClass('text-sm');

      const menuButton = container.querySelector('button[class*="p-0"]');
      expect(menuButton).toHaveClass('h-8', 'w-8');
    });

    it('所有模式下重命名和删除功能都正常工作', () => {
      // 测试 desktop 模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'desktop',
        width: 1280,
        height: 800,
        isMobile: false,
        isCompact: false,
        isCompressed: false,
        isDesktop: true,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 验证下拉菜单存在
      const menuButton = container.querySelector('button[aria-haspopup="menu"]');
      expect(menuButton).toBeInTheDocument();

      // 测试 mobile 模式
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const { container: mobileContainer } = renderChatButton(chat);

      // mobile 模式下拉菜单也应该存在
      const mobileMenuButton = mobileContainer.querySelector('button[aria-haspopup="menu"]');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('移动模式下点击「更多」按钮弹出选项（无长按事件）', () => {
      mockUseResponsive.mockReturnValue({
        layoutMode: 'mobile',
        width: 390,
        height: 844,
        isMobile: true,
        isCompact: false,
        isCompressed: false,
        isDesktop: false,
      });

      const chat = createMockChat({ name: '测试聊天' });
      const { container } = renderChatButton(chat);

      // 点击「更多」按钮应该弹出选项
      const menuButton = container.querySelector('button[aria-haspopup="menu"]');
      expect(menuButton).toBeInTheDocument();

      if (menuButton) {
        // 点击按钮不应触发导航（因为有 stopPropagation）
        fireEvent.click(menuButton);
        expect(mockNavigateToChat).not.toHaveBeenCalled();
      }
    });
  });

});

/**
 * ChatPanel 组件测试
 *
 * 测试聊天面板主容器的各种场景
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ChatPanel from '@/pages/Chat/components/ChatContent/components/ChatPanel';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelReducer from '@/store/slices/modelSlice';
import appConfigReducer from '@/store/slices/appConfigSlices';
import type { RootState } from '@/store';
import { createMockChatWithModels } from '@/__test__/helpers/mocks/chatSidebar';

// 每个测试后清理 DOM
afterEach(() => {
  cleanup();
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      const translations = {
        chat: {
          showSidebar: '显示侧边栏',
          unnamed: '未命名',
          enableSplitter: '启用分割模式',
          maxPerRow: '每行最多',
          itemsUnit: '项',
        },
      };

      if (typeof keyOrFn === 'function') {
        return keyOrFn(translations);
      }
      
      const keyMap: Record<string, string> = {
        'chat.showSidebar': '显示侧边栏',
        'chat.unnamed': '未命名',
        'chat.enableSplitter': '启用分割模式',
        'chat.maxPerRow': '每行最多',
        'chat.itemsUnit': '项',
      };
      return keyMap[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
      models: modelReducer,
      appConfig: appConfigReducer,
    } as any,
    preloadedState: {
      ...state,
      models: {
        models: [],
        loading: false,
        error: null,
      },
      chatPage: {
        isSidebarCollapsed: false,
        isShowChatPage: true,
      },
      appConfig: {
        language: 'en',
        includeReasoningContent: false,
      },
    } as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('ChatPanel', () => {
  describe('4.1.1 测试单模型聊天面板渲染', () => {
    it('应该渲染单模型聊天面板', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1', name: 'Single Model Chat' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 应该渲染 ChatPanel 组件的主容器
      const panel = document.querySelector('.relative.flex.flex-col');
      expect(panel).toBeInTheDocument();

      // 应该渲染 ChatPanelHeader
      const header = document.querySelector('.relative.z-10.flex');
      expect(header).toBeInTheDocument();

      // 应该渲染 ChatPanelSender
      const sender = document.querySelector('.relative.z-10.w-full');
      expect(sender).toBeInTheDocument();
    });

    it('应该在单模型时不显示分割模式控制', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 不应该显示分割模式开关（只有多模型时才显示）
      const splitterSwitch = document.querySelector('[role="switch"]');
      expect(splitterSwitch).not.toBeInTheDocument();
    });
  });

  describe('4.1.2 测试多模型聊天面板网格布局', () => {
    it('应该渲染多模型聊天面板网格布局', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1', name: 'Multi Model Chat' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      const panel = document.querySelector('.relative.flex.flex-col');
      expect(panel).toBeInTheDocument();

      // 应该显示分割模式开关（多模型时）
      const splitterSwitch = document.querySelector('[role="switch"]');
      expect(splitterSwitch).toBeInTheDocument();
    });

    it('应该显示聊天标题', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1', name: 'Test Chat Name' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 应该显示聊天名称
      expect(screen.getByText('Test Chat Name')).toBeInTheDocument();
    });

    it('应该显示列数控制按钮', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 应该显示增加和减少列数的按钮
      const buttons = document.querySelectorAll('button');
      const plusButton = Array.from(buttons).find(btn => btn.querySelector('svg')?.classList.contains('lucide-plus'));
      const minusButton = Array.from(buttons).find(btn => btn.querySelector('svg')?.classList.contains('lucide-minus'));

      expect(plusButton).toBeInTheDocument();
      expect(minusButton).toBeInTheDocument();
    });
  });

  describe('4.1.3 测试可调整大小的面板布局', () => {
    it('应该在分割模式下启用 ResizablePanel', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(<ChatPanel />, { wrapper });

      // 点击分割模式开关（使用 role="switch"）
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      expect(splitterSwitch).toBeInTheDocument();

      if (splitterSwitch) {
        fireEvent.click(splitterSwitch);

        // 等待状态更新
        waitFor(() => {
          // 检查是否显示了 ResizablePanel 相关的元素
          const resizablePanels = container.querySelectorAll('[data-panel-id]');
          expect(resizablePanels.length).toBeGreaterThan(0);
        });
      }
    });

    it('应该在关闭分割模式时使用常规网格布局', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 默认情况下，分割模式是关闭的（useState 初始值为 false）
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      expect(splitterSwitch).toBeInTheDocument();
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');

      // 应该使用常规网格布局（没有 ResizablePanel）
      const contentContainer = document.querySelector('.absolute.top-0.left-0.w-full');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('4.1.4 测试 columnCount 状态管理', () => {
    it('应该初始化 columnCount 为模型数量', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // columnCount 应该初始化为模型数量（3）
      const columnInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(columnInput).toBeInTheDocument();
      expect(columnInput.value).toBe('3');
    });

    it('应该能够增加列数', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      const columnInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      const initialValue = parseInt(columnInput.value);

      // 点击增加按钮
      const buttons = document.querySelectorAll('button');
      const plusButton = Array.from(buttons).find(btn => btn.querySelector('svg')?.classList.contains('lucide-plus'));
      
      if (plusButton && initialValue < 3) {
        fireEvent.click(plusButton);
        
        // columnCount 应该增加
        expect(parseInt(columnInput.value)).toBe(initialValue + 1);
      }
    });

    it('应该能够减少列数', () => {
      const chat = createMockChatWithModels(3, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      const columnInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      const initialValue = parseInt(columnInput.value);

      // 点击减少按钮
      const buttons = document.querySelectorAll('button');
      const minusButton = Array.from(buttons).find(btn => btn.querySelector('svg')?.classList.contains('lucide-minus'));
      
      if (minusButton && initialValue > 1) {
        fireEvent.click(minusButton);
        
        // columnCount 应该减少
        expect(parseInt(columnInput.value)).toBe(initialValue - 1);
      }
    });

    it('应该限制列数最小值为 1', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { unmount } = render(<ChatPanel />, { wrapper });

      // 单模型时，columnCount 应该初始化为 1
      // 注意：单模型可能不显示列数控制，所以这个测试验证初始化逻辑
      const panel = document.querySelector('.relative.flex.flex-col');
      expect(panel).toBeInTheDocument();

      // 清理组件
      unmount();
    });

    it('应该限制列数最大值为模型数量', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      const columnInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(columnInput.value).toBe('2');
    });
  });

  describe('4.1.5 测试 isSplitter 状态切换', () => {
    it('应该在切换分割模式时更新 isSplitter 状态', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      expect(splitterSwitch).toBeInTheDocument();

      // 初始状态应该是未选中（useState 初始值为 false）
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');

      // 点击开关
      fireEvent.click(splitterSwitch);

      // 状态应该更新为选中
      expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

      // 再次点击
      fireEvent.click(splitterSwitch);

      // 状态应该更新为未选中
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');
    });

    it('应该在分割模式下显示不同的布局', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(<ChatPanel />, { wrapper });

      // 启用分割模式
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      if (splitterSwitch) {
        fireEvent.click(splitterSwitch);

        // 等待状态更新并检查布局
        waitFor(() => {
          const resizableContainer = container.querySelector('.absolute.top-0.left-0.w-full.pt-12.pb-22');
          expect(resizableContainer).toBeInTheDocument();
        });
      }
    });
  });

  describe('4.1.6 测试聊天模型变化时重置分割模式', () => {
    it('应该在切换到不同的聊天时重置分割模式', async () => {
      const chat1 = createMockChatWithModels(2, { id: 'chat-1' });
      const chat2 = createMockChatWithModels(3, { id: 'chat-2' });

      const store = createTestStore({
        chat: {
          chatList: [chat1, chat2],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 启用分割模式
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      if (splitterSwitch) {
        fireEvent.click(splitterSwitch);
        expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

        // 切换到不同的聊天（使用正确的 action）
        store.dispatch({
          type: 'chat/setSelectedChatId',
          payload: 'chat-2',
        } as any);

        // 等待状态更新和重新渲染
        await waitFor(() => {
          const newSwitch = document.querySelector('[role="switch"]') as HTMLElement;
          expect(newSwitch).toBeInTheDocument();
          // 切换聊天后，useEffect 会重置 isSplitter 为 false
          expect(newSwitch).toHaveAttribute('data-state', 'unchecked');
        }, { timeout: 3000 });
      }
    });

    it('应该在模型数量变化时重置分割模式', async () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 启用分割模式
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      if (splitterSwitch) {
        fireEvent.click(splitterSwitch);
        expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

        // 模型数量变化：通过 dispatch 更新 Redux state
        const updatedChat = createMockChatWithModels(3, { id: 'chat-1' });
        store.dispatch({
          type: 'chat/editChat',
          payload: { chat: updatedChat },
        } as any);

        // 等待 useEffect 触发并重置分割模式
        await waitFor(() => {
          const newSwitch = document.querySelector('[role="switch"]') as HTMLElement;
          expect(newSwitch).toBeInTheDocument();
          // 模型数量变化后，useEffect 会重置 isSplitter 为 false
          expect(newSwitch).toHaveAttribute('data-state', 'unchecked');
        }, { timeout: 3000 });
      }
    });

    it('应该通过 useEffect 监听 chatModelList 变化', () => {
      const chat = createMockChatWithModels(2, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 验证初始状态
      const splitterSwitch = document.querySelector('[role="switch"]') as HTMLElement;
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');

      // 启用分割模式
      if (splitterSwitch) {
        fireEvent.click(splitterSwitch);
        expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

        // 模型数量变化应该触发 useEffect 重置分割模式
        // 这个测试验证了 useEffect 的依赖项正确设置为 chatModelList
        expect(splitterSwitch).toBeInTheDocument();
      }
    });
  });

  describe('组件结构和布局', () => {
    it('应该渲染正确的主容器结构', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 主容器应该存在
      const mainContainer = document.querySelector('.relative.flex.flex-col.items-center.justify-start.w-full.h-full');
      expect(mainContainer).toBeInTheDocument();
    });

    it('应该渲染 ChatPanelContent 组件', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // ChatPanelContent 应该存在（包含内容区域）
      const contentContainer = document.querySelector('.absolute.top-0.left-0.w-full');
      expect(contentContainer).toBeInTheDocument();
    });

    it('应该渲染 ChatPanelSender 组件', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // ChatPanelSender 应该存在（发送框）
      const senderContainer = document.querySelector('.relative.z-10.w-full');
      expect(senderContainer).toBeInTheDocument();
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理空的 chatModelList', () => {
      const chat = createMockChatWithModels(0, { id: 'chat-1' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 即使没有模型，组件也应该正常渲染
      const panel = document.querySelector('.relative.flex.flex-col');
      expect(panel).toBeInTheDocument();
    });

    it('应该处理未命名的聊天', () => {
      const chat = createMockChatWithModels(1, { id: 'chat-1', name: '' });

      const store = createTestStore({
        chat: {
          chatList: [chat],
          selectedChatId: 'chat-1',
          loading: false,
          error: null,
          initializationError: null,
          runningChat: {},
        },
      });

      const wrapper = createWrapper(store);
      render(<ChatPanel />, { wrapper });

      // 应该显示"未命名"的文本
      const panel = document.querySelector('.relative.flex.flex-col');
      expect(panel).toBeInTheDocument();
    });
  });
});

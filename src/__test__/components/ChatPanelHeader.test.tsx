/**
 * ChatPanelHeader 组件测试
 * 测试聊天面板头部控制组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ChatPanelHeader from '@/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelHeader';
import type { Chat } from '@/types/chat';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      // 创建完整的翻译对象
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
      
      // 如果是字符串 key，返回对应的翻译
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

const createTestStore = (chat?: Chat, isSidebarCollapsed = false) => {
  const defaultChat: Chat = {
    id: 'test-chat-1',
    name: 'Test Chat',
    chatModelList: [
      { modelId: 'model-1', chatHistoryList: [] },
      { modelId: 'model-2', chatHistoryList: [] },
    ],
    isDeleted: false,
  };

  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
    } as any,
    preloadedState: {
      chat: {
        chatList: [chat || defaultChat],
        selectedChatId: (chat || defaultChat).id,
        loading: false,
        error: null,
        initializationError: null,
        runningChat: {},
      },
      chatPage: {
        isSidebarCollapsed,
        isShowChatPage: false,
      },
    } as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('ChatPanelHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 清理 DOM
    document.body.innerHTML = '';
  });

  describe('4.7.1 测试调整列数功能', () => {
    it('应该显示当前列数值', () => {
      const setColumnCount = vi.fn();
      const store = createTestStore();

      const { container } = render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement)?.value).toBe('2');
    });

    it('应该能够通过输入框调整列数', async () => {
      const setColumnCount = vi.fn();
      const store = createTestStore();

      const { container } = render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const input = container.querySelector('input[type="number"]');
      if (input) {
        fireEvent.change(input, { target: { value: '3' } });
        await waitFor(() => {
          expect(setColumnCount).toHaveBeenCalledWith(3);
        });
      }
    });

    it('应该在列数达到最大值时禁用加按钮', () => {
      const setColumnCount = vi.fn();
      const store = createTestStore();

      const { container } = render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('max')).toBe('2');
    });

    it('应该限制列数的最小值为 1', () => {
      const setColumnCount = vi.fn();
      const store = createTestStore();

      const { container } = render(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('min')).toBe('1');
    });

    it('应该显示每行最大数标签', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByText(/每行最多/i)).toBeInTheDocument();
    });

    it('应该显示单位标签', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByText(/项/i)).toBeInTheDocument();
    });
  });

  describe('4.7.2 测试切换分割模式', () => {
    it('应该显示分割模式开关', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('应该能够切换分割模式状态', async () => {
      const setIsSplitter = vi.fn();
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={setIsSplitter}
        />,
        { wrapper: createWrapper(store) }
      );

      const switchButton = screen.getByRole('switch');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(setIsSplitter).toHaveBeenCalledWith(true);
      });
    });

    it('应该正确显示开关的当前状态 - 未开启', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const switchButton = screen.getByRole('switch');
      expect(switchButton).toHaveAttribute('data-state', 'unchecked');
    });

    it('应该正确显示开关的当前状态 - 已开启', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={true}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const switchButton = screen.getByRole('switch');
      expect(switchButton).toHaveAttribute('data-state', 'checked');
    });

    it('应该在关闭分割模式时正确更新状态', async () => {
      const setIsSplitter = vi.fn();
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={true}
          setIsSplitter={setIsSplitter}
        />,
        { wrapper: createWrapper(store) }
      );

      const switchButton = screen.getByRole('switch');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(setIsSplitter).toHaveBeenCalledWith(false);
      });
    });

    it('应该显示分割模式标签', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByText(/启用分割模式/i)).toBeInTheDocument();
    });
  });

  describe('4.7.3 测试聊天模型变化时重置分割模式', () => {
    it('应该在单个模型时不显示分割控制', () => {
      const singleModelChat: Chat = {
        id: 'test-chat-single',
        name: 'Single Model Chat',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      const store = createTestStore(singleModelChat);

      render(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('应该在多个模型时显示分割控制', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('应该根据模型数量动态更新最大列数', () => {
      const threeModelsChat: Chat = {
        id: 'test-chat-three',
        name: 'Three Models Chat',
        chatModelList: [
          { modelId: 'model-1', chatHistoryList: [] },
          { modelId: 'model-2', chatHistoryList: [] },
          { modelId: 'model-3', chatHistoryList: [] },
        ],
        isDeleted: false,
      };

      const store = createTestStore(threeModelsChat);

      const { container } = render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('max')).toBe('3');
    });
  });

  describe('4.7.4 测试头部按钮交互', () => {
    it('应该在侧边栏折叠时显示展开按钮', () => {
      const store = createTestStore(undefined, true);

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByTitle('显示侧边栏')).toBeInTheDocument();
    });

    it('应该在侧边栏未折叠时不显示展开按钮', () => {
      const store = createTestStore(undefined, false);

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.queryByTitle('显示侧边栏')).not.toBeInTheDocument();
    });

    it('应该显示聊天名称', () => {
      const namedChat: Chat = {
        id: 'test-chat-named',
        name: 'My Awesome Chat',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      const store = createTestStore(namedChat);

      render(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByText(/My Awesome Chat/i)).toBeInTheDocument();
    });

    it('应该为未命名聊天显示默认文本', () => {
      const unnamedChat: Chat = {
        id: 'test-chat-unnamed',
        name: '',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      const store = createTestStore(unnamedChat);

      render(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(screen.getByText('未命名')).toBeInTheDocument();
    });

    it('应该正确渲染头部容器元素', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const header = document.querySelector('.relative.z-10');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'items-center', 'justify-between');
    });

    it('应该包含边框样式', () => {
      const store = createTestStore();

      render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      const header = document.querySelector('.relative');
      expect(header).toHaveClass('border-b');
    });

    it('应该在挂载和卸载时设置 isShowChatPage', () => {
      const store = createTestStore();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      const { unmount } = render(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { wrapper: createWrapper(store) }
      );

      expect(dispatchSpy).toHaveBeenCalled();

      dispatchSpy.mockClear();
      unmount();

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});

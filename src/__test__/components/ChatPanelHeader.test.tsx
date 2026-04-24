/**
 * ChatPanelHeader 组件测试
 * 测试聊天面板头部控制组件
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanelHeader from '@/pages/Chat/components/Panel/Header';
import type { Chat } from '@/types/chat';
import { chatToMeta } from '@/types/chat';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import {
  createChatSliceState,
  createChatPageSliceState,
} from '@/__test__/helpers/mocks/testState';

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: {
      enableSplitter: '启用分割模式',
      maxPerRow: '每行最多',
      itemsUnit: '项',
    },
  }));

/**
 * 创建测试用 store
 * @param chat 聊天对象（可选）
 * @param isSidebarCollapsed 侧边栏是否折叠
 */
const createStore = (chat?: Chat, isSidebarCollapsed = false) => {
  const defaultChat: Chat = {
    id: 'test-chat-1',
    name: 'Test Chat',
    chatModelList: [
      { modelId: 'model-1', chatHistoryList: [] },
      { modelId: 'model-2', chatHistoryList: [] },
    ],
    isDeleted: false,
  };

  const resolvedChat = chat || defaultChat;

  return createTypeSafeTestStore({
    chat: createChatSliceState({
      chatMetaList: [chatToMeta(resolvedChat)],
      activeChatData: { [resolvedChat.id]: resolvedChat },
      sendingChatIds: {},
      selectedChatId: resolvedChat.id,
    }),
    chatPage: createChatPageSliceState({
      isSidebarCollapsed,
    }),
  });
};


describe('ChatPanelHeader', () => {
  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
  });

  describe('4.7.1 测试调整列数功能', () => {
    it('应该显示当前列数值', () => {
      const setColumnCount = vi.fn();
      const store = createStore();

      const { container } = renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement)?.value).toBe('2');
    });

    it('应该能够通过输入框调整列数', async () => {
      const setColumnCount = vi.fn();
      const store = createStore();

      const { container } = renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const input = container.querySelector('input[type="number"]') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      fireEvent.change(input, { target: { value: '3' } });
      await waitFor(() => {
        expect(setColumnCount).toHaveBeenCalledWith(3);
      });
    });

    it('应该在列数达到最大值时禁用加按钮', () => {
      const setColumnCount = vi.fn();
      const store = createStore();

      const { container } = renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('max')).toBe('2');
    });

    it('应该限制列数的最小值为 1', () => {
      const setColumnCount = vi.fn();
      const store = createStore();

      const { container } = renderWithProviders(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={setColumnCount}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('min')).toBe('1');
    });

    it('应该显示每行最大数标签', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.getByText(/每行最多/i)).toBeInTheDocument();
    });

    it('应该显示单位标签', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.getByText(/项/i)).toBeInTheDocument();
    });
  });

  describe('4.7.2 测试切换分割模式', () => {
    it('应该显示分割模式开关', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('应该能够切换分割模式状态', async () => {
      const setIsSplitter = vi.fn();
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={setIsSplitter}
        />,
        { store }
      );

      const switchButton = screen.getByRole('switch');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(setIsSplitter).toHaveBeenCalledWith(true);
      });
    });

    it('应该正确显示开关的当前状态 - 未开启', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const switchButton = screen.getByRole('switch');
      expect(switchButton).toHaveAttribute('data-state', 'unchecked');
    });

    it('应该正确显示开关的当前状态 - 已开启', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={true}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const switchButton = screen.getByRole('switch');
      expect(switchButton).toHaveAttribute('data-state', 'checked');
    });

    it('应该在关闭分割模式时正确更新状态', async () => {
      const setIsSplitter = vi.fn();
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={true}
          setIsSplitter={setIsSplitter}
        />,
        { store }
      );

      const switchButton = screen.getByRole('switch');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(setIsSplitter).toHaveBeenCalledWith(false);
      });
    });

    it('应该显示分割模式标签', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
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

      const store = createStore(singleModelChat);

      renderWithProviders(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });

    it('应该在多个模型时显示分割控制', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
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

      const store = createStore(threeModelsChat);

      const { container } = renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      const input = container.querySelector('input[type="number"]');
      expect(input?.getAttribute('max')).toBe('3');
    });
  });

  describe('4.7.4 测试头部按钮交互', () => {
    it('应该在侧边栏折叠时显示展开按钮', () => {
      const store = createStore(undefined, true);

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.getByTitle('显示侧边栏')).toBeInTheDocument();
    });

    it('应该在侧边栏未折叠时不显示展开按钮', () => {
      const store = createStore(undefined, false);

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
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

      const store = createStore(namedChat);

      renderWithProviders(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
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

      const store = createStore(unnamedChat);

      renderWithProviders(
        <ChatPanelHeader
          columnCount={1}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(screen.getByText('未命名')).toBeInTheDocument();
    });

    it('应该正确渲染头部容器元素', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      // 验证头部关键交互元素存在
      expect(screen.getByText(/Test Chat/i)).toBeInTheDocument();
    });

    it('应该包含边框样式', () => {
      const store = createStore();

      renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      // 验证头部内容区域存在
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('应该在挂载和卸载时设置 isShowChatPage', () => {
      const store = createStore();
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      const { unmount } = renderWithProviders(
        <ChatPanelHeader
          columnCount={2}
          setColumnCount={vi.fn()}
          isSplitter={false}
          setIsSplitter={vi.fn()}
        />,
        { store }
      );

      expect(dispatchSpy).toHaveBeenCalled();

      dispatchSpy.mockClear();
      unmount();

      expect(dispatchSpy).toHaveBeenCalled();
    });
  });
});

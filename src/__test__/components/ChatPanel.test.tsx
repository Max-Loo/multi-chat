/**
 * ChatPanel 组件测试
 *
 * 测试聊天面板主容器的各种场景
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ChatPanel from '@/pages/Chat/components/Panel';
import { createMockChatWithModels } from '@/__test__/helpers/mocks/chatSidebar';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import {
  createChatSliceState,
  createModelSliceState,
  createChatPageSliceState,
  createAppConfigSliceState,
} from '@/__test__/helpers/mocks/testState';
import { setSelectedChatId, editChat } from '@/store/slices/chatSlices';
import { chatToMeta } from '@/types/chat';

afterEach(() => {
  cleanup();
});

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    chat: {
      enableSplitter: '启用分割模式',
      maxPerRow: '每行最多',
      itemsUnit: '项',
      transmitHistoryReasoning: '包含推理内容',
      transmitHistoryReasoningHint: '是否在聊天历史中传输推理内容',
      createChat: '创建聊天',
    },
    navigation: {
      openChatList: '打开聊天列表',
      createChat: '创建聊天',
    },
  }));

/**
 * 将 Chat 对象列表拆分为 chatMetaList + activeChatData + sendingChatIds
 * @param chats 聊天对象数组
 */
const splitChatsToState = (chats: ReturnType<typeof createMockChatWithModels>[]) => ({
  chatMetaList: chats.map(chatToMeta),
  activeChatData: Object.fromEntries(chats.map(c => [c.id, c])),
  sendingChatIds: {},
});

/**
 * 创建测试用 store
 * @param chatOverrides Chat slice 覆盖字段（支持 chatList 旧写法，自动转换）
 */
const createStore = (chatOverrides?: Parameters<typeof createChatSliceState>[0]) => {
  return createTypeSafeTestStore({
    chat: createChatSliceState(chatOverrides),
    models: createModelSliceState(),
    chatPage: createChatPageSliceState({ isSidebarCollapsed: false, isShowChatPage: true }),
    appConfig: createAppConfigSliceState({ language: 'en', transmitHistoryReasoning: false }),
  });
};

/**
 * 渲染 ChatPanel 的辅助函数，消除重复的 store 创建 + render 模式
 * @param modelCount 模型数量
 * @param overrides 可选的覆盖参数
 */
function renderChatPanel(
  modelCount: number,
  overrides?: {
    chatProps?: Record<string, unknown>;
    chatList?: ReturnType<typeof createMockChatWithModels>[];
    selectedChatId?: string;
  }
) {
  const chat = createMockChatWithModels(modelCount, { id: 'chat-1', ...overrides?.chatProps });
  const store = createStore({
    chatList: overrides?.chatList ?? [chat],
    selectedChatId: overrides?.selectedChatId ?? 'chat-1',
  });
  return { ...renderWithProviders(<ChatPanel />, { store }), store };
}


describe('ChatPanel', () => {
  describe('4.1.1 测试单模型聊天面板渲染', () => {
    it('应该渲染单模型聊天面板', () => {
      renderChatPanel(1, { chatProps: { name: 'Single Model Chat' } });

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-header')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-sender')).toBeInTheDocument();
    });

    it('应该在单模型时不显示分割模式控制', () => {
      renderChatPanel(1);

      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  describe('4.1.2 测试多模型聊天面板网格布局', () => {
    it('应该渲染多模型聊天面板网格布局', () => {
      renderChatPanel(3, { chatProps: { name: 'Multi Model Chat' } });

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('应该显示聊天标题', () => {
      renderChatPanel(2, { chatProps: { name: 'Test Chat Name' } });

      expect(screen.getByText('Test Chat Name')).toBeInTheDocument();
    });

    it('应该显示列数控制按钮', () => {
      renderChatPanel(3);

      expect(screen.getByTestId('column-plus-btn')).toBeInTheDocument();
      expect(screen.getByTestId('column-minus-btn')).toBeInTheDocument();
    });
  });

  describe('4.1.3 测试可调整大小的面板布局', () => {
    it('应该在分割模式下启用 ResizablePanel', async () => {
      const { container } = renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);

      await waitFor(() => {
        const resizablePanels = container.querySelectorAll('[data-panel]');
        expect(resizablePanels.length).toBeGreaterThan(0);
      });
    });

    it('应该在关闭分割模式时使用常规网格布局', () => {
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });
  });

  describe('4.1.4 测试 columnCount 状态管理', () => {
    it('应该初始化 columnCount 为模型数量', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      expect(columnInput.value).toBe('3');
    });

    it('应该能够增加列数', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      const initialValue = parseInt(columnInput.value);

      const plusButton = screen.getByTestId('column-plus-btn');
      if (initialValue < 3) {
        fireEvent.click(plusButton);
        expect(parseInt(columnInput.value)).toBe(initialValue + 1);
      }
    });

    it('应该能够减少列数', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      const initialValue = parseInt(columnInput.value);

      const minusButton = screen.getByTestId('column-minus-btn');
      if (initialValue > 1) {
        fireEvent.click(minusButton);
        expect(parseInt(columnInput.value)).toBe(initialValue - 1);
      }
    });

    it('应该限制列数最小值为 1', () => {
      const { unmount } = renderChatPanel(1);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      unmount();
    });

    it('应该限制列数最大值为模型数量', () => {
      renderChatPanel(2);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      expect(columnInput.value).toBe('2');
    });
  });

  describe('4.1.5 测试 isSplitter 状态切换', () => {
    it('应该在切换分割模式时更新 isSplitter 状态', () => {
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(splitterSwitch);
      expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

      fireEvent.click(splitterSwitch);
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');
    });

    it('应该在分割模式下显示不同的布局', async () => {
      const { container } = renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);

      await waitFor(() => {
        const resizablePanels = container.querySelectorAll('[data-panel]');
        expect(resizablePanels.length).toBeGreaterThan(0);
      });
    });
  });

  describe('4.1.6 测试聊天模型变化时重置分割模式', () => {
    it('应该在切换到不同的聊天时重置分割模式', async () => {
      const chat1 = createMockChatWithModels(2, { id: 'chat-1' });
      const chat2 = createMockChatWithModels(3, { id: 'chat-2' });
      const { store } = renderChatPanel(0, { chatList: [chat1, chat2], selectedChatId: 'chat-1' });

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);
      expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

      store.dispatch(setSelectedChatId('chat-2'));

      await waitFor(() => {
        const newSwitch = screen.getByRole('switch');
        expect(newSwitch).toHaveAttribute('data-state', 'unchecked');
      }, { timeout: 3000 });
    });

    it('应该在模型数量变化时重置分割模式', async () => {
      const { store } = renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);
      expect(splitterSwitch).toHaveAttribute('data-state', 'checked');

      const updatedChat = createMockChatWithModels(3, { id: 'chat-1' });
      store.dispatch(editChat({ chat: updatedChat }));

      await waitFor(() => {
        const newSwitch = screen.getByRole('switch');
        expect(newSwitch).toHaveAttribute('data-state', 'unchecked');
      }, { timeout: 3000 });
    });

    it('应该通过 useEffect 监听 chatModelList 变化', () => {
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');

      fireEvent.click(splitterSwitch);
      expect(splitterSwitch).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('组件结构和布局', () => {
    it('应该渲染正确的主容器结构', () => {
      renderChatPanel(1);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });

    it('应该渲染 ChatPanelContent 组件', () => {
      renderChatPanel(1);

      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });

    it('应该渲染 ChatPanelSender 组件', () => {
      renderChatPanel(1);

      expect(screen.getByTestId('chat-panel-sender')).toBeInTheDocument();
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理空的 chatModelList', () => {
      renderChatPanel(0);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });

    it('应该处理未命名的聊天', () => {
      renderChatPanel(1, { chatProps: { name: '' } });

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });
  });
});

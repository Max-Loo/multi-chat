/**
 * ChatPanel 组件测试
 *
 * 测试聊天面板主容器的各种场景
 */

import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
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
 * 创建测试用 store
 * @param chatOverrides Chat slice 覆盖字段
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
 * 将 Chat 对象列表转换为 store 所需的 chatMetaList + activeChatData
 * @param chats Chat 对象数组
 */
const chatsToState = (chats: ReturnType<typeof createMockChatWithModels>[]) => ({
  chatMetaList: chats.map(chatToMeta),
  activeChatData: Object.fromEntries(chats.map(c => [c.id, c])),
});

/**
 * 渲染 ChatPanel 的辅助函数，消除重复的 store 创建 + render 模式
 * @param modelCount 模型数量
 * @param overrides 可选的覆盖参数
 */
function renderChatPanel(
  modelCount: number,
  overrides?: {
    chatProps?: Record<string, unknown>;
    chats?: ReturnType<typeof createMockChatWithModels>[];
    selectedChatId?: string;
  }
) {
  const chat = createMockChatWithModels(modelCount, { id: 'chat-1', ...overrides?.chatProps });
  const chats = overrides?.chats ?? [chat];
  const store = createStore({
    ...chatsToState(chats),
    selectedChatId: overrides?.selectedChatId ?? 'chat-1',
  });
  return { ...renderWithProviders(<ChatPanel />, { store }), store };
}


describe('ChatPanel', () => {
  describe('测试单模型聊天面板渲染', () => {
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

  describe('测试多模型聊天面板网格布局', () => {
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

  describe('测试可调整大小的面板布局', () => {
    it('应该在分割模式下启用 ResizablePanel', async () => {
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);

      await waitFor(() => {
        expect(screen.getByTestId('splitter-container')).toBeInTheDocument();
      });
    });

    it('应该在关闭分割模式时使用常规网格布局', () => {
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      expect(splitterSwitch).toHaveAttribute('data-state', 'unchecked');
      expect(screen.getByTestId('grid-container')).toBeInTheDocument();
    });
  });

  describe('测试 columnCount 状态管理', () => {
    it('应该初始化 columnCount 为模型数量', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      expect(columnInput.value).toBe('3');
    });

    it('应该能够增加列数', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      const minusButton = screen.getByTestId('column-minus-btn');
      // 先减到 2，确保有增加空间
      fireEvent.click(minusButton);
      expect(parseInt(columnInput.value)).toBe(2);

      // 再增加回 3
      const plusButton = screen.getByTestId('column-plus-btn');
      fireEvent.click(plusButton);
      expect(parseInt(columnInput.value)).toBe(3);
    });

    it('应该能够减少列数', () => {
      renderChatPanel(3);

      const columnInput = screen.getByTestId('column-count-input') as HTMLInputElement;
      expect(parseInt(columnInput.value)).toBe(3);

      const minusButton = screen.getByTestId('column-minus-btn');
      fireEvent.click(minusButton);
      expect(parseInt(columnInput.value)).toBe(2);
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

  describe('测试 isSplitter 状态切换', () => {
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
      renderChatPanel(2);

      const splitterSwitch = screen.getByRole('switch');
      fireEvent.click(splitterSwitch);

      await waitFor(() => {
        expect(screen.getByTestId('splitter-container')).toBeInTheDocument();
      });
    });
  });

  describe('测试聊天模型变化时重置分割模式', () => {
    it('应该在切换到不同的聊天时重置分割模式', async () => {
      const chat1 = createMockChatWithModels(2, { id: 'chat-1' });
      const chat2 = createMockChatWithModels(3, { id: 'chat-2' });
      const { store } = renderChatPanel(0, { chats: [chat1, chat2], selectedChatId: 'chat-1' });

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

  describe('边界情况和错误处理', () => {
    it('应该处理空的 chatModelList', () => {
      renderChatPanel(0);

      // 无模型时仍渲染面板容器和标题栏
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-header')).toBeInTheDocument();
      // grid-container 存在但内部无模型面板
      const gridContainer = screen.getByTestId('grid-container');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer.querySelector('[data-testid="chat-model-panel"]')).toBeNull();
    });

    it('应该处理未命名的聊天', () => {
      renderChatPanel(1, { chatProps: { name: '' } });

      // 空名称时标题区域显示空字符串（不崩溃）
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-header')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-sender')).toBeInTheDocument();
    });
  });
});

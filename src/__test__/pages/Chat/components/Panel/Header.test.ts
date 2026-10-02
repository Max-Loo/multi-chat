/**
 * ChatPanel 头部组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/components/ChatPanelHeader.test.tsx，保留核心行为语义：
 * - 聊天名称显示（未命名默认文本）
 * - 列数控制（输入/加减按钮、上下限禁用）
 * - Splitter 开关切换
 * - 多模型显示分割控制、单模型隐藏
 * - 侧边栏折叠时显示展开按钮
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  navigateToChat: vi.fn(),
  clearChatIdParam: vi.fn(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/composables/useNavigateToPage', () => ({
  useNavigateToChat: () => ({
    navigateToChat: mocks.navigateToChat,
    clearChatIdParam: mocks.clearChatIdParam,
  }),
}));

import Header from '@/pages/Chat/components/Panel/Header.vue';
import { createAppPinia, useChatStore } from '@/stores';
import { useChatPageStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';
import type { ChatModel } from '@/types/chat';

/** 多模型聊天（2 个模型） */
const chatData = {
  id: 'chat-header-test',
  name: '标题测试聊天',
  chatModelList: [
    createMockPanelChatModel('m1'),
    createMockPanelChatModel('m2'),
  ] as ChatModel[],
  isDeleted: false,
};

interface RenderOptions {
  columnCount?: number;
  isSplitter?: boolean;
  chat?: typeof chatData;
  isSidebarCollapsed?: boolean;
}

/** 渲染 Header（准备选中聊天） */
function renderHeader(options: RenderOptions = {}) {
  const pinia = createAppPinia();
  const chat = options.chat ?? chatData;
  const chatStore = useChatStore(pinia);
  chatStore.chatMetaList = [{ id: chat.id, name: chat.name, modelIds: [], isDeleted: false }];
  chatStore.activeChatData = { [chat.id]: chat };
  chatStore.selectedChatId = chat.id;
  if (options.isSidebarCollapsed !== undefined) {
    useChatPageStore(pinia).setIsCollapsed(options.isSidebarCollapsed);
  }

  const result = render(Header, {
    props: {
      columnCount: options.columnCount ?? chat.chatModelList.length,
      isSplitter: options.isSplitter ?? false,
    },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia };
}

describe('ChatPanelHeader（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  describe('聊天名称显示', () => {
    it('应该显示聊天名称', () => {
      renderHeader();

      expect(screen.getByText('标题测试聊天')).toBeInTheDocument();
    });

    it('应该为未命名聊天显示默认文本', () => {
      renderHeader({
        chat: { ...chatData, name: '' },
      });

      expect(screen.getByText('未命名')).toBeInTheDocument();
    });
  });

  describe('列数控制', () => {
    it('应该显示当前列数值', () => {
      renderHeader({ columnCount: 2 });

      const input = screen.getByTestId('column-count-input');
      expect(input).toHaveValue(2);
    });

    it('应该在列数达到最大值时禁用加按钮', () => {
      renderHeader({ columnCount: 2 });

      expect(screen.getByTestId('column-plus-btn')).toHaveAttribute('disabled');
    });

    it('应该限制列数的最小值为 1（减按钮禁用）', () => {
      renderHeader({ columnCount: 1 });

      expect(screen.getByTestId('column-minus-btn')).toHaveAttribute('disabled');
    });

    it('点击加按钮应该向外 emit 新列数', async () => {
      const { emitted } = renderHeader({ columnCount: 1 });

      await fireEvent.click(screen.getByTestId('column-plus-btn'));

      expect(emitted('update:columnCount')).toEqual([[2]]);
    });

    it('点击减按钮应该向外 emit 新列数', async () => {
      const { emitted } = renderHeader({ columnCount: 2 });

      await fireEvent.click(screen.getByTestId('column-minus-btn'));

      expect(emitted('update:columnCount')).toEqual([[1]]);
    });
  });

  describe('Splitter 开关', () => {
    it('应该显示分割模式开关且初始未开启', () => {
      renderHeader({ isSplitter: false });

      const switchEl = screen.getByTestId('splitter-switch');
      expect(switchEl).toHaveAttribute('role', 'switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('切换开关应该向外 emit 新状态', async () => {
      const { emitted } = renderHeader({ isSplitter: false });

      await fireEvent.click(screen.getByTestId('splitter-switch'));

      expect(emitted('update:isSplitter')).toEqual([[true]]);
    });

    it('已开启时开关状态为 true', () => {
      renderHeader({ isSplitter: true });

      expect(screen.getByTestId('splitter-switch')).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });

  describe('模型数量差异', () => {
    it('应该在单个模型时不显示分割控制', () => {
      renderHeader({
        chat: {
          ...chatData,
          chatModelList: [createMockPanelChatModel('m1')],
        },
      });

      expect(
        screen.queryByTestId('splitter-switch'),
      ).not.toBeInTheDocument();
    });

    it('应该在多个模型时显示分割控制', () => {
      renderHeader();

      expect(screen.getByTestId('splitter-switch')).toBeInTheDocument();
    });
  });

  describe('侧边栏展开按钮', () => {
    it('应该在侧边栏折叠时显示展开按钮', () => {
      renderHeader({ isSidebarCollapsed: true });

      expect(screen.getByTitle('显示侧边栏')).toBeInTheDocument();
    });

    it('应该在侧边栏未折叠时不显示展开按钮', () => {
      renderHeader({ isSidebarCollapsed: false });

      expect(screen.queryByTitle('显示侧边栏')).not.toBeInTheDocument();
    });

    it('点击展开按钮应该复位折叠状态', async () => {
      const { pinia } = renderHeader({ isSidebarCollapsed: true });

      await fireEvent.click(screen.getByTitle('显示侧边栏'));

      expect(useChatPageStore(pinia).isSidebarCollapsed).toBe(false);
    });
  });
});

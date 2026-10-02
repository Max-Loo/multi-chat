/**
 * Content 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/ChatContent.test.tsx，保留核心语义：
 * - 无选中聊天时显示占位内容
 * - 聊天无模型配置时渲染模型选择
 * - 聊天有模型配置时渲染聊天面板
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

// Mock 异步子组件：Content 测试聚焦状态切换，不测子组件内部行为
// __esModule: true 让 defineAsyncComponent 的模块检测取到 default（否则命名空间被当组件渲染）
vi.mock('@/pages/Chat/components/ModelSelect/ModelSelect.vue', () => ({
  __esModule: true,
  default: {
    template: '<div data-testid="mock-model-select">ModelSelect</div>',
  },
}));
vi.mock('@/pages/Chat/components/Panel/Panel.vue', () => ({
  __esModule: true,
  default: {
    template: '<div data-testid="mock-chat-panel">Panel</div>',
  },
}));

import Content from '@/pages/Chat/components/Content/Content.vue';
import { createAppPinia } from '@/stores';
import { useChatStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';

/** 渲染 Content（独立 pinia） */
function renderContent() {
  const pinia = createAppPinia();
  const result = render(Content, { global: { plugins: [pinia] } });
  return { ...result, pinia };
}

describe('Content（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示占位内容 当没有选中聊天', () => {
    renderContent();

    expect(screen.getByText('选择聊天开聊！')).toBeInTheDocument();
  });

  it('应该渲染模型选择 当聊天没有模型配置', async () => {
    const { pinia } = renderContent();
    const chatStore = useChatStore(pinia);
    chatStore.chatMetaList = [{ id: 'chat-1', name: '聊天1', modelIds: [], isDeleted: false }];
    chatStore.activeChatData = {
      'chat-1': { id: 'chat-1', name: '聊天1', chatModelList: [], isDeleted: false },
    };
    chatStore.selectedChatId = 'chat-1';

    await waitFor(() => {
      expect(screen.getByTestId('mock-model-select')).toBeInTheDocument();
    });
  });

  it('应该渲染聊天面板 当聊天有模型配置', async () => {
    const { pinia } = renderContent();
    const chatStore = useChatStore(pinia);
    chatStore.chatMetaList = [{ id: 'chat-1', name: '聊天1', modelIds: [], isDeleted: false }];
    chatStore.activeChatData = {
      'chat-1': {
        id: 'chat-1',
        name: '聊天1',
        chatModelList: [createMockPanelChatModel('model-1')],
        isDeleted: false,
      },
    };
    chatStore.selectedChatId = 'chat-1';

    await waitFor(() => {
      expect(screen.getByTestId('mock-chat-panel')).toBeInTheDocument();
    });
  });
});

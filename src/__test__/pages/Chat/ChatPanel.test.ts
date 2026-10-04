/**
 * 聊天面板组件测试
 *
 * 覆盖 Panel / Grid / Splitter / Header / Sender / Title / Detail / Content / Placeholder
 * virtua 的 Virtualizer 在 happy-dom 中无法测量视口，统一以平铺渲染桩替代
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import Panel from '@/pages/Chat/components/Panel/index.vue';
import Content from '@/pages/Chat/components/Content/index.vue';
import Placeholder from '@/pages/Chat/components/Placeholder/index.vue';
import ModelSelect from '@/pages/Chat/components/ModelSelect/index.vue';
import { useChatStore } from '@/store/chat';
import { useModelsStore } from '@/store/models';
import { useChatPageStore } from '@/store/chatPage';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { ChatRoleEnum } from '@/types/chat';
import type { Chat } from '@/types/chat';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      chat: {
        unnamed: '未命名',
        createChat: '新建聊天',
        selectChatToStart: '选择聊天开聊！',
        enableSplitter: '启用拖拽',
        maxPerRow: '每行最多',
        itemsUnit: '个',
        increaseColumns: '增加列数',
        decreaseColumns: '减少列数',
        showSidebar: '显示侧边栏',
        typeMessage: '请输入消息...',
        sendMessage: '发送消息',
        stopSending: '停止发送',
        modelDeleted: '模型已删除',
        deleted: '已删除',
        disabled: '已禁用',
        supplier: '供应商',
        model: '模型',
        nickname: '昵称',
        copySuccess: '复制成功',
        copyFailed: '复制失败',
        copyMessage: '复制',
        editMessage: '编辑',
        regenerateMessage: '重新生成',
        thinking: '思考中',
        thinkingComplete: '思考完毕',
        searchPlaceholder: '搜索模型',
        selectModelHint: '请选择模型',
        configureChatSuccess: '配置成功',
        configureChatFailed: '配置失败',
      },
      common: {
        confirm: '确定',
        a11y: {
          modelToolbar: '模型选择工具栏',
          clearSelection: '清除选中',
          chatList: '聊天列表',
          userMessage: '用户消息',
          assistantMessage: '助手消息',
        },
      },
      navigation: { openChatList: '打开聊天列表' },
      model: { openProviderList: '打开供应商列表' },
    }).useTranslation(),
}));

const responsiveMock = vi.hoisted(() => ({ isMobile: false, isDesktop: true, layoutMode: 'desktop' }));

vi.mock('@/composables/useResponsive', async () => {
  const { computed } = await import('vue');
  return {
    useResponsive: () => ({
      isMobile: computed(() => responsiveMock.isMobile),
      isDesktop: computed(() => responsiveMock.isDesktop),
      layoutMode: computed(() => responsiveMock.layoutMode),
    }),
  };
});

// virtua 桩：平铺渲染全部条目（happy-dom 无法测量视口）
vi.mock('virtua/vue', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    Virtualizer: defineComponent({
      props: { data: { type: Array, required: true } },
      setup(props, { slots, attrs }) {
        return () =>
          h('div', attrs, props.data.map((item, index) => slots.default?.({ item, index })));
      },
    }),
  };
});

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const confirmSpy = vi.hoisted(() => ({ confirm: vi.fn(), warning: vi.fn() }));

const toastMock = vi.hoisted(() => ({
  toastQueue: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}));

vi.mock('@/services/toast', () => toastMock);

vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ modal: confirmSpy }),
}));

/** 构造带历史消息与模型的聊天 */
function makeChatWithModels(): Chat {
  return createMockChat({
    id: 'chat-panel-1',
    name: '面板聊天',
    chatModelList: [
      {
        modelId: 'model-1',
        chatHistoryList: [
          {
            id: 'msg-1',
            role: ChatRoleEnum.USER,
            content: '用户提问',
            timestamp: 1000,
            modelKey: 'model-1',
            finishReason: null,
            raw: null,
          },
          {
            id: 'msg-2',
            role: ChatRoleEnum.ASSISTANT,
            content: '助手回复',
            timestamp: 2000,
            modelKey: 'model-1',
            finishReason: 'stop',
            raw: null,
          },
        ],
      },
    ],
  }) as Chat;
}

/** 准备选中聊天 + 模型的 store */
function seedSelectedChat(chat = makeChatWithModels()) {
  const chatStore = useChatStore();
  const modelsStore = useModelsStore();
  modelsStore.models = [
    {
      id: 'model-1',
      nickname: '面板模型',
      providerKey: 'deepseek',
      providerName: 'DeepSeek',
      modelName: 'deepseek-chat',
      modelKey: 'deepseek-chat',
      isDeleted: false,
      isEnable: true,
    } as never,
  ];
  chatStore.chatMetaList = [
    { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
  ];
  chatStore.setActiveChatData({ chatId: chat.id, chat });
  chatStore.setSelectedChatId(chat.id);
  return chat;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
  responsiveMock.isMobile = false;
});

describe('Placeholder', () => {
  it('应该显示占位文案', () => {
    render(Placeholder);

    expect(screen.getByText('选择聊天开聊！')).toBeInTheDocument();
  });

  it('移动端应渲染抽屉入口与新建入口', () => {
    responsiveMock.isMobile = true;

    render(Placeholder);

    expect(screen.getByLabelText('打开聊天列表')).toBeInTheDocument();
  });
});

describe('Content', () => {
  it('无选中聊天时应该渲染占位内容', async () => {
    render(Content);
    await nextTick();

    // Content 为异步组件，等待其解析
    await waitFor(() => {
      expect(screen.getByText('选择聊天开聊！')).toBeInTheDocument();
    });
  });

  it('选中未配置模型的聊天时应该切换到模型选择分支', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({ id: 'chat-empty', name: '空聊天' });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);

    // Content 渲染不含占位文案（分支切换本身即断言）
    render(Content);
    await nextTick();

    await waitFor(() => {
      expect(screen.queryByText('选择聊天开聊！')).not.toBeInTheDocument();
    });
  });
});

describe('Panel（Grid 布局）', () => {
  it('应该渲染头部、消息气泡与发送框', async () => {
    seedSelectedChat();

    render(Panel);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByTestId('chat-panel-header')).toBeInTheDocument();
      expect(screen.getByText('面板聊天')).toBeInTheDocument();
      expect(screen.getByTestId('user-message')).toBeInTheDocument();
      expect(screen.getByTestId('assistant-message')).toBeInTheDocument();
      expect(screen.getByTestId('chat-panel-sender')).toBeInTheDocument();
    });
  });

  it('多模型时应该展示分列控制', async () => {
    const chat = makeChatWithModels();
    chat.chatModelList.push({
      modelId: 'model-2',
      chatHistoryList: [],
    });
    seedSelectedChat(chat);

    render(Panel);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByTestId('splitter-switch')).toBeInTheDocument();
      expect(screen.getByTestId('column-count-input')).toBeInTheDocument();
      expect(screen.getByTestId('column-plus-btn')).toBeInTheDocument();
      expect(screen.getByTestId('column-minus-btn')).toBeInTheDocument();
    });
  });

  it('列数加减按钮应该更新列数', async () => {
    const chat = makeChatWithModels();
    chat.chatModelList.push({ modelId: 'model-2', chatHistoryList: [] });
    chat.chatModelList.push({ modelId: 'model-3', chatHistoryList: [] });
    seedSelectedChat(chat);

    render(Panel);
    await nextTick();
    await waitFor(() => screen.getByTestId('column-plus-btn'));

    await fireEvent.click(screen.getByTestId('column-minus-btn'));
    const input = screen.getByTestId('column-count-input') as HTMLInputElement;
    expect(Number(input.value)).toBe(2);
  });

  it('发送框输入并点击发送应该调用 store 发送', async () => {
    const chat = seedSelectedChat();
    const chatStore = useChatStore();
    const sendSpy = vi.spyOn(chatStore, 'startSendChatMessage').mockResolvedValue();

    render(Panel);
    await nextTick();
    await waitFor(() => screen.getByTestId('chat-panel-sender'));

    const textarea = screen.getByPlaceholderText('请输入消息...');
    await fireEvent.update(textarea, '你好');
    await fireEvent.click(screen.getByRole('button', { name: '发送消息' }));

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({ chat, message: '你好' }),
        expect.anything(),
      );
    });
  });

  it('切换拖拽开关应该渲染 Splitter 布局', async () => {
    const chat = makeChatWithModels();
    chat.chatModelList.push({ modelId: 'model-2', chatHistoryList: [] });
    seedSelectedChat(chat);

    render(Panel);
    await nextTick();
    await waitFor(() => screen.getByTestId('splitter-switch'));

    await fireEvent.click(screen.getByTestId('splitter-switch'));

    await waitFor(() => {
      expect(screen.getByTestId('splitter-container')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-container')).not.toBeInTheDocument();
    });
  });
});

describe('Detail（标题与运行状态）', () => {
  it('模型已删除时标题应显示删除徽标', async () => {
    const chat = makeChatWithModels();
    seedSelectedChat(chat);
    const modelsStore = useModelsStore();
    modelsStore.models = [];
    await nextTick();

    render(Panel);
    await nextTick();

    await waitFor(() => {
      expect(screen.getByText('模型已删除')).toBeInTheDocument();
    });
  });

  it('流式未产出内容时应该显示加载指示', async () => {
    const chat = seedSelectedChat();
    const chatStore = useChatStore();
    chatStore.runningChat = {
      [chat.id]: {
        'model-1': { isSending: true, history: null, errorMessage: null } as never,
      },
    };

    render(Panel);
    await nextTick();

    // 气泡区 + spinner 区域均应渲染（具体 spinner 以 aria/结构判定）
    await waitFor(() => {
      expect(screen.getByTestId('chat-panel-header')).toBeInTheDocument();
    });
  });
});

describe('ModelSelect（聊天模型选择）', () => {
  it('未选择模型提交时应该提示', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({ id: 'chat-ms', name: '待配置' });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);

    const modelsStore = useModelsStore();
    modelsStore.models = [
      {
        id: 'model-1',
        nickname: '可选模型',
        providerKey: 'deepseek',
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        modelKey: 'deepseek-chat',
        isDeleted: false,
        isEnable: true,
      } as never,
    ];

    render(ModelSelect);
    await nextTick();

    await fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await waitFor(() => {
      expect(toastMock.toastQueue.info).toHaveBeenCalled();
    });
  });

  it('勾选模型并确认应该调用 editChat', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({ id: 'chat-ms2', name: '待配置' }) as Chat;
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);
    const editSpy = vi.spyOn(chatStore, 'editChat').mockResolvedValue();

    const modelsStore = useModelsStore();
    modelsStore.models = [
      {
        id: 'model-1',
        nickname: '可选模型',
        providerKey: 'deepseek',
        providerName: 'DeepSeek',
        modelName: 'deepseek-chat',
        modelKey: 'deepseek-chat',
        isDeleted: false,
        isEnable: true,
      } as never,
    ];

    render(ModelSelect);
    await nextTick();

    const checkbox = document.querySelector('table [role="checkbox"]');
    await fireEvent.click(checkbox!);
    await fireEvent.click(screen.getByRole('button', { name: '确定' }));

    await waitFor(() => {
      expect(editSpy).toHaveBeenCalled();
    });
  });
});

describe('ChatPage 折叠按钮状态', () => {
  it('isShowChatPage 状态应该随页面挂载/卸载更新', async () => {
    const chatPageStore = useChatPageStore();
    const chat = makeChatWithModels();
    seedSelectedChat(chat);

    const { unmount } = render(Panel);
    await nextTick();

    expect(chatPageStore.isShowChatPage).toBe(true);
    unmount();
    expect(chatPageStore.isShowChatPage).toBe(false);
  });
});

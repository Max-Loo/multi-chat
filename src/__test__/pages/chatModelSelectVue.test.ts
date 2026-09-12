/**
 * Vue ModelSelect 组件测试
 *
 * 对应 React 版 ModelSelect.test.tsx 的行为断言：
 * 表格渲染模型行、确认按钮交互（未选中提示/选中写入聊天配置）、
 * checkbox 选择与清除、移动端供应商列表入口，以及 DataTable 通用能力（加载/空态）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/vue';

// Mock vue-router（useCurrentSelectedChat 依赖）
vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/chat', query: {} }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock toastQueue
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// hoisted：可变的移动端标志，供 useResponsive mock 读取
const { mockIsMobile } = vi.hoisted(() => ({ mockIsMobile: { value: false } }));

// Mock 响应式适配
vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () =>
    globalThis.__createResponsiveMock({
      isMobile: mockIsMobile.value,
      isDesktop: !mockIsMobile.value,
      layoutMode: mockIsMobile.value ? 'mobile' : 'desktop',
    }),
}));

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: {
      selectModelHint: '请选择至少一个模型',
      configureChatSuccess: '配置聊天成功',
      configureChatFailed: '配置聊天失败',
      searchPlaceholder: '搜索模型...',
    },
    model: { openProviderList: '打开供应商列表' },
    common: { confirm: '确认', remark: '备注', a11y: { clearSelection: '清除选中', modelToolbar: '模型选择工具栏' } },
    table: {
      nickname: '模型名称',
      modelProvider: '模型供应商',
      modelName: '模型',
      lastUpdateTime: '更新时间',
      createTime: '创建时间',
      loading: '加载中...',
      emptyData: '暂无数据',
    },
  }));

import ModelSelect from '@/pages/Chat/components/ModelSelect/ModelSelect.vue';
import DataTable from '@/components/ui-vue/data-table/DataTable.vue';
import { useChatStore } from '@/store/pinia/chat';
import { useModelStore } from '@/store/pinia/model';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { chatToMeta } from '@/types/chat';

/** 组装三个 Pinia store 的测试数据 */
const setupStores = () => {
  const chatStore = useChatStore();
  const chat = createMockChat({ id: 'chat-1', name: 'Test Chat' });
  chatStore.selectedChatId = 'chat-1';
  chatStore.chatMetaList = [chatToMeta(chat)];
  chatStore.activeChatData = { 'chat-1': chat };

  const modelStore = useModelStore();
  modelStore.models = [
    createMockModel({ id: 'model-1', nickname: 'GPT-4', providerKey: 'deepseek' as never, modelName: 'gpt-4', providerName: 'OpenAI' }),
    createMockModel({ id: 'model-2', nickname: 'Claude 3', providerKey: 'moonshotai' as never, modelName: 'claude-3-opus', providerName: 'Anthropic' }),
    createMockModel({ id: 'model-3', nickname: 'DeepSeek', providerKey: 'deepseek' as never, modelName: 'deepseek-chat', providerName: 'DeepSeek' }),
  ];
  modelStore.loading = false;

  const providerStore = useModelProviderStore();
  providerStore.providers = [
    { providerKey: 'deepseek', providerName: 'DeepSeek', models: [] },
    { providerKey: 'moonshotai', providerName: 'Moonshot', models: [] },
  ] as never;

  return { chatStore, modelStore };
};

describe('ModelSelect（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('渲染模型表格与确认按钮', () => {
    setupStores();
    render(ModelSelect);

    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '确认' })).toBeTruthy();
    expect(screen.getByText('GPT-4')).toBeVisible();
    expect(screen.getByText('Claude 3')).toBeVisible();
    // DeepSeek 既是模型昵称也是供应商名（供应商列展示），至少出现一次
    expect(screen.getAllByText('DeepSeek').length).toBeGreaterThanOrEqual(1);
  });

  it('表格行数与模型数量对应（表头 + 3 行）', () => {
    setupStores();
    render(ModelSelect);

    const table = screen.getAllByRole('table')[0];
    expect(within(table).getAllByRole('row').length).toBe(4);
  });

  it('未选择模型时点击确认显示提示', async () => {
    setupStores();
    render(ModelSelect);
    const { toastQueue } = await import('@/services/toast');

    await fireEvent.click(screen.getByRole('button', { name: '确认' }));

    expect(toastQueue.info).toHaveBeenCalledWith('请选择至少一个模型');
  });

  it('checkbox 选择模型后显示清除按钮与标签', async () => {
    setupStores();
    render(ModelSelect);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThanOrEqual(1);
    await fireEvent.click(checkboxes[0]);

    expect(screen.getByLabelText('清除选中')).toBeTruthy();
  });

  it('点击清除按钮清空所有选中', async () => {
    setupStores();
    render(ModelSelect);

    const checkboxes = screen.getAllByRole('checkbox');
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(checkboxes[1]);

    await fireEvent.click(screen.getByLabelText('清除选中'));

    expect(screen.queryByLabelText('清除选中')).toBeNull();
  });

  it('选中模型后点击确认写入聊天配置', async () => {
    const { chatStore } = setupStores();
    const editSpy = vi.spyOn(chatStore, 'editChat').mockResolvedValue(undefined);
    render(ModelSelect);

    const checkboxes = screen.getAllByRole('checkbox');
    await fireEvent.click(checkboxes[0]);
    await fireEvent.click(screen.getByRole('button', { name: '确认' }));

    await waitFor(() => expect(editSpy).toHaveBeenCalledTimes(1));
    const { chat } = editSpy.mock.calls[0][0] as { chat: { id: string; chatModelList: { modelId: string; chatHistoryList: unknown[] }[] } };
    expect(chat.id).toBe('chat-1');
    expect(chat.chatModelList).toEqual([{ modelId: 'model-1', chatHistoryList: [] }]);
  });

  it('移动端显示打开供应商列表按钮并触发抽屉', async () => {
    mockIsMobile.value = true;
    setupStores();
    const { useChatPageStore } = await import('@/store/pinia/chatPage');
    render(ModelSelect);

    const openBtn = screen.getByLabelText('打开供应商列表');
    await fireEvent.click(openBtn);

    expect(useChatPageStore().isDrawerOpen).toBe(true);
    mockIsMobile.value = false;
  });

  it('点击标签可取消选中模型', async () => {
    setupStores();
    render(ModelSelect);

    const checkboxes = screen.getAllByRole('checkbox');
    await fireEvent.click(checkboxes[0]);
    expect(screen.getByLabelText('清除选中')).toBeTruthy();

    // 标签内的 × 按钮
    const badgeButton = screen.getByText('×');
    await fireEvent.click(badgeButton);

    expect(screen.queryByLabelText('清除选中')).toBeNull();
  });
});

describe('DataTable（Vue 版通用表格）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  interface Row {
    id: string;
    name: string;
  }

  const columns = [
    { accessorKey: 'name', header: '名称' },
  ];

  it('渲染数据行与自定义列', () => {
    render(DataTable, {
      props: {
        columns: columns as never,
        data: [
          { id: 'a', name: 'Alice' },
          { id: 'b', name: 'Bob' },
        ] satisfies Row[],
      },
    });

    expect(screen.getByText('Alice')).toBeVisible();
    expect(screen.getByText('Bob')).toBeVisible();
    expect(screen.getAllByRole('row').length).toBe(3);
  });

  it('loading 时显示加载占位', () => {
    render(DataTable, { props: { columns: columns as never, data: [] as Row[], loading: true } });

    expect(screen.getByText('加载中...')).toBeVisible();
  });

  it('空数据显示空态提示', () => {
    render(DataTable, { props: { columns: columns as never, data: [] as Row[] } });

    expect(screen.getByText('暂无数据')).toBeVisible();
  });

  it('支持自定义空态文本', () => {
    render(DataTable, { props: { columns: columns as never, data: [] as Row[], emptyText: '没有模型' } });

    expect(screen.getByText('没有模型')).toBeVisible();
  });
});

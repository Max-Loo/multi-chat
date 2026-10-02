/**
 * ModelTable 页面测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/ModelTable/ModelTable.test.tsx，
 * 保留核心行为语义：
 * - 基础渲染（添加按钮、过滤输入框、模型行）
 * - 加载 / 初始化错误 / 操作错误状态
 * - 昵称过滤（含防抖、不区分大小写、清空恢复）
 * - 空数据提示
 * - 编辑（打开弹窗）与删除（确认气泡 → deleteModel + toast）
 * - 添加按钮导航
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.routerPush }),
}));

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

vi.mock('@/pages/Model/ModelTable/components/EditModelModal.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['isModalOpen', 'modelProviderKey', 'modelParams'],
    template:
      '<div data-testid="mock-edit-modal" :data-open="String(isModalOpen)" />',
  },
}));

import ModelTable from '@/pages/Model/ModelTable/index.vue';
import { createAppPinia, useModelStore, useModelProviderStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import { createMockModel, createMockModels } from '@/__test__/helpers/fixtures/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

/** 准备 store 并渲染 ModelTable */
function renderTable(models: Model[] = [], stateOverrides?: { loading?: boolean; error?: string | null; initializationError?: string | null }) {
  const pinia = createAppPinia();
  const modelStore = useModelStore(pinia);
  modelStore.models = models;
  if (stateOverrides?.loading !== undefined)
    modelStore.loading = stateOverrides.loading;
  if (stateOverrides?.error !== undefined)
    modelStore.error = stateOverrides.error;
  if (stateOverrides?.initializationError !== undefined)
    modelStore.initializationError = stateOverrides.initializationError;

  // 填充供应商记录（表格供应商列真实渲染）
  useModelProviderStore(pinia).providers = [
    {
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      providerName: 'DeepSeek',
      api: 'https://api.deepseek.com',
      models: [],
    },
  ];

  const result = render(ModelTable, { global: { plugins: [pinia] } });
  return { ...result, modelStore };
}

describe('ModelTable（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该渲染添加模型按钮和过滤输入框', () => {
    renderTable();

    expect(screen.getByText('添加模型')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索昵称或备注')).toBeInTheDocument();
  });

  it('应该渲染模型列表', () => {
    renderTable(createMockModels(3));

    expect(screen.getAllByText('Test Model')).toHaveLength(3);
  });

  it('应该显示加载状态', () => {
    renderTable([], { loading: true });

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('应该显示初始化错误', () => {
    renderTable([], { initializationError: '初始化失败' });

    expect(screen.getByText('数据加载失败')).toBeInTheDocument();
    expect(screen.getByText('初始化失败')).toBeInTheDocument();
  });

  it('应该显示操作错误', () => {
    renderTable([], { error: '操作出错' });

    expect(screen.getByText('操作失败')).toBeInTheDocument();
    expect(screen.getByText('操作出错')).toBeInTheDocument();
  });

  it('应该显示空数据提示', () => {
    renderTable([]);

    expect(screen.getByText(/暂无模型数据/)).toBeInTheDocument();
  });

  it('应该根据昵称过滤模型列表', async () => {
    vi.useFakeTimers();
    renderTable([
      createMockModel({ id: 'm1', nickname: 'Alpha 模型' }),
      createMockModel({ id: 'm2', nickname: 'Beta 模型' }),
    ]);

    await fireEvent.update(
      screen.getByPlaceholderText('搜索昵称或备注'),
      'alpha',
    );
    await vi.advanceTimersByTimeAsync(300);

    expect(screen.getByText('Alpha 模型')).toBeInTheDocument();
    expect(screen.queryByText('Beta 模型')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('清空过滤条件应该显示所有模型', async () => {
    vi.useFakeTimers();
    renderTable([
      createMockModel({ id: 'm1', nickname: 'Alpha 模型' }),
      createMockModel({ id: 'm2', nickname: 'Beta 模型' }),
    ]);

    await fireEvent.update(
      screen.getByPlaceholderText('搜索昵称或备注'),
      'alpha',
    );
    await vi.advanceTimersByTimeAsync(300);
    await fireEvent.update(
      screen.getByPlaceholderText('搜索昵称或备注'),
      '',
    );
    await vi.advanceTimersByTimeAsync(300);

    expect(screen.getByText('Alpha 模型')).toBeInTheDocument();
    expect(screen.getByText('Beta 模型')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('点击添加模型按钮应该导航到创建页面', async () => {
    renderTable();

    await fireEvent.click(screen.getByText('添加模型'));

    expect(mocks.routerPush).toHaveBeenCalledWith('/model/add');
  });

  it('点击编辑按钮应该打开编辑弹窗', async () => {
    renderTable([createMockModel({ id: 'm-edit' })]);

    // 操作列的编辑按钮（第一个操作按钮）
    const operationButtons = screen.getAllByLabelText('操作');
    await fireEvent.click(operationButtons[0]);

    expect(screen.getByTestId('mock-edit-modal')).toHaveAttribute(
      'data-open',
      'true',
    );
  });

  it('确认删除应该触发删除操作并显示成功 toast', async () => {
    const model = createMockModel({ id: 'm-del', nickname: '待删除' });
    const { modelStore } = renderTable([model]);
    const deleteSpy = vi.spyOn(modelStore, 'deleteModel');

    // 点击删除按钮（aria-label=确认删除）打开确认气泡
    await fireEvent.click(screen.getAllByLabelText('确认删除')[0]);

    // 气泡内容 portal 渲染，异步等待
    const confirmButton = await screen.findByRole('button', { name: '确定' });
    await fireEvent.click(confirmButton);

    expect(deleteSpy).toHaveBeenCalledWith(model);
    expect(toastQueue.success).toHaveBeenCalledWith('模型删除成功');
    // 确认后气泡关闭
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: '确定' }),
      ).not.toBeInTheDocument();
    });
  });

  it('取消删除应该关闭确认气泡且不删除', async () => {
    const model = createMockModel({ id: 'm-del', nickname: '待删除' });
    const { modelStore } = renderTable([model]);
    const deleteSpy = vi.spyOn(modelStore, 'deleteModel');

    await fireEvent.click(screen.getAllByLabelText('确认删除')[0]);
    const cancelButton = await screen.findByRole('button', { name: '取消' });
    await fireEvent.click(cancelButton);

    expect(deleteSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: '取消' }),
      ).not.toBeInTheDocument();
    });
  });
});

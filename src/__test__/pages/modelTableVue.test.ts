/**
 * Vue ModelTable 组件测试
 *
 * 对应 React 版 ModelTable.test.tsx 的行为断言：
 * 列表渲染、添加按钮与搜索框、加载/错误/空态、搜索过滤（大小写不敏感）、
 * 编辑弹窗打开与删除确认流程。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
  useRoute: () => ({ path: '/model/table', query: {} }),
}));
const pushMock = vi.hoisted(() => vi.fn());

// Mock toastQueue
vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    model: {
      addModel: '添加模型',
      searchPlaceholder: '搜索模型...',
      noModelData: '暂无模型数据',
      confirmDelete: '确认删除',
      confirmDeleteDescription: '确认要删除模型 {{nickname}} 吗？',
      deleteModelSuccess: '删除成功',
      deleteModelFailed: '删除失败',
      dataLoadFailed: '数据加载失败',
      operationFailed: '操作失败',
      fixErrorReload: '修复错误后重新加载',
    },
    common: { cancel: '取消', confirm: '确认' },
    table: { loading: '加载中...', operation: '操作' },
  }));

import ModelTable from '@/pages/Model/ModelTable.vue';
import { useModelStore } from '@/store/pinia/model';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createDeepSeekProvider, createKimiProvider } from '@/__test__/helpers/fixtures/modelProvider';
import { ModelProviderKeyEnum } from '@/utils/enums';

/** 组装 store 测试数据 */
const setupStores = () => {
  const modelStore = useModelStore();
  modelStore.models = [
    createMockModel({ id: '1', nickname: 'DeepSeek Chat', providerKey: ModelProviderKeyEnum.DEEPSEEK, modelName: 'deepseek-chat' }),
    createMockModel({ id: '2', nickname: 'Kimi Chat', providerKey: ModelProviderKeyEnum.MOONSHOTAI, modelName: 'moonshot-v1-8k' }),
    createMockModel({ id: '3', nickname: 'Zhipu Chat', providerKey: ModelProviderKeyEnum.ZHIPUAI as never, modelName: 'glm-4' }),
  ];
  modelStore.loading = false;
  modelStore.error = null;
  modelStore.initializationError = null;

  const providerStore = useModelProviderStore();
  providerStore.providers = [createDeepSeekProvider(), createKimiProvider()];

  return modelStore;
};

describe('ModelTable（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    pushMock.mockClear();
  });

  it('渲染模型列表', () => {
    setupStores();
    render(ModelTable);

    expect(screen.getByText('DeepSeek Chat')).toBeVisible();
    expect(screen.getByText('Kimi Chat')).toBeVisible();
    expect(screen.getByText('Zhipu Chat')).toBeVisible();
  });

  it('显示添加模型按钮与过滤输入框', () => {
    setupStores();
    render(ModelTable);

    expect(screen.getByRole('button', { name: '添加模型' })).toBeTruthy();
    expect(screen.getByPlaceholderText('搜索模型...')).toBeTruthy();
  });

  it('加载中时显示加载占位', () => {
    const modelStore = setupStores();
    modelStore.models = [];
    modelStore.loading = true;
    render(ModelTable);

    expect(screen.getByText('加载中...')).toBeVisible();
  });

  it('显示初始化错误', () => {
    const modelStore = setupStores();
    modelStore.models = [];
    modelStore.initializationError = 'Failed to load models';
    render(ModelTable);

    expect(screen.getByText('数据加载失败')).toBeVisible();
    expect(screen.getByText('Failed to load models')).toBeVisible();
  });

  it('显示操作错误', () => {
    const modelStore = setupStores();
    modelStore.error = 'Operation failed';
    render(ModelTable);

    expect(screen.getByText('操作失败')).toBeVisible();
    expect(screen.getByText('Operation failed')).toBeVisible();
  });

  it('根据昵称过滤模型列表', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.update(screen.getByPlaceholderText('搜索模型...'), 'DeepSeek');

    await waitFor(() => expect(screen.queryByText('Kimi Chat')).toBeNull());
    expect(screen.getByText('DeepSeek Chat')).toBeVisible();
    expect(screen.queryByText('Zhipu Chat')).toBeNull();
  });

  it('支持不区分大小写的过滤', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.update(screen.getByPlaceholderText('搜索模型...'), 'kimi');

    await waitFor(() => expect(screen.queryByText('DeepSeek Chat')).toBeNull());
    expect(screen.getByText('Kimi Chat')).toBeVisible();
  });

  it('清空过滤条件后显示所有模型', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.update(screen.getByPlaceholderText('搜索模型...'), 'DeepSeek');
    await waitFor(() => expect(screen.queryByText('Kimi Chat')).toBeNull());

    await fireEvent.update(screen.getByPlaceholderText('搜索模型...'), '');
    await waitFor(() => expect(screen.getByText('Kimi Chat')).toBeVisible());
    expect(screen.getByText('Zhipu Chat')).toBeVisible();
  });

  it('空数据显示空数据提示', () => {
    const modelStore = setupStores();
    modelStore.models = [];
    render(ModelTable);

    expect(screen.getByText('暂无模型数据')).toBeVisible();
  });

  it('点击编辑按钮打开编辑弹窗', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.click(screen.getAllByRole('button', { name: '操作' })[0]);

    await waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull());
  });

  it('点击删除按钮显示确认框', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.click(screen.getAllByRole('button', { name: '确认删除' })[0]);

    await waitFor(() => expect(screen.getByText('确认删除')).toBeVisible());
    expect(screen.getByText('确认要删除模型 DeepSeek Chat 吗？')).toBeVisible();
  });

  it('取消删除关闭确认框', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.click(screen.getAllByRole('button', { name: '确认删除' })[0]);
    await waitFor(() => expect(screen.getByText('确认删除')).toBeVisible());

    await fireEvent.click(screen.getByRole('button', { name: '取消' }));

    await waitFor(() => expect(screen.queryByText('确认要删除模型 DeepSeek Chat 吗？')).toBeNull());
  });

  it('确认删除触发删除操作并提示成功', async () => {
    const modelStore = setupStores();
    const deleteSpy = vi.spyOn(modelStore, 'deleteModel').mockResolvedValue(undefined);
    const { toastQueue } = await import('@/services/toast');
    render(ModelTable);

    await fireEvent.click(screen.getAllByRole('button', { name: '确认删除' })[0]);
    await waitFor(() => expect(screen.getByText('确认删除')).toBeVisible());

    await fireEvent.click(screen.getByRole('button', { name: '确认' }));

    await waitFor(() => expect(deleteSpy).toHaveBeenCalledTimes(1));
    expect(toastQueue.success).toHaveBeenCalledWith('删除成功');
  });

  it('点击添加模型按钮跳转创建页', async () => {
    setupStores();
    render(ModelTable);

    await fireEvent.click(screen.getByRole('button', { name: '添加模型' }));

    expect(pushMock).toHaveBeenCalledWith('/model/add');
  });
});

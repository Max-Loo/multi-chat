/**
 * 模型域组件测试（转写自 React ModelTable / ModelConfigForm / ModelSelect 测试）
 *
 * 验证表格渲染与操作、表单校验与提交流程、模型选择器
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import ModelTable from '@/pages/Model/ModelTable/index.vue';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import ModelSelect from '@/pages/Model/components/ModelSelect.vue';
import { useModelsStore } from '@/store/models';
import { useModelProviderStore } from '@/store/modelProvider';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { RemoteProviderData } from '@/services/modelRemote';
import type { Model } from '@/types/model';

vi.mock('i18next-vue', () => ({
  useTranslation: () =>
    globalThis.__createI18nMockReturn({
      common: { submit: '提交', confirm: '确定', cancel: '取消', remark: '备注' },
      model: {
        addModel: '添加模型',
        searchPlaceholder: '搜索模型',
        deleteModelSuccess: '删除成功',
        deleteModelFailed: '删除失败',
        confirmDelete: '确认删除',
        confirmDeleteDescription: '将删除 {{nickname}}',
        dataLoadFailed: '数据加载失败',
        operationFailed: '操作失败',
        noModelData: '暂无模型数据',
        fixErrorReload: '修复错误后重试',
        modelNickname: '模型昵称',
        modelNicknameRequired: '请输入昵称',
        apiKey: 'API Key',
        apiKeyRequired: '请输入 API Key',
        apiAddress: 'API 地址',
        apiAddressRequired: '请输入 API 地址',
        model: '模型',
        modelRequired: '请选择模型',
        addModelSuccess: '添加成功',
        addModelFailed: '添加失败',
        editModelSuccess: '编辑成功',
        editModelFailed: '编辑失败',
        modelProvider: '模型供应商',
        searchModel: '搜索供应商',
        openMenu: '打开菜单',
        title: '添加模型',
      },
      table: {
        nickname: '昵称',
        modelProvider: '供应商',
        modelName: '模型名',
        lastUpdateTime: '更新时间',
        createTime: '创建时间',
        operation: '操作',
        emptyData: '暂无数据',
        loading: '加载中',
      },
    }).useTranslation(),
}));

const routerMock = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
}));

/** 构造供应商测试数据 */
function makeProvider(): RemoteProviderData {
  return {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com',
    models: [
      { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
      { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
    ],
  } as unknown as RemoteProviderData;
}

/** 构造模型测试数据 */
function makeModel(overrides: Partial<Model> = {}): Model {
  return {
    id: 'model-1',
    nickname: '测试模型',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    modelName: 'DeepSeek Chat',
    modelKey: 'deepseek-chat',
    apiKey: 'sk-test',
    apiAddress: 'https://api.deepseek.com',
    createdAt: '2026-01-01 00:00:00',
    updateAt: '2026-01-01 00:00:00',
    isEnable: true,
    isDeleted: false,
    remark: '',
    ...overrides,
  } as Model;
}

/** 准备 store：一个供应商 + 一个模型 */
function seedStores(): { modelsStore: ReturnType<typeof useModelsStore> } {
  const modelsStore = useModelsStore();
  const providerStore = useModelProviderStore();
  // 供应商数据直接写入（Pinia setup store 的 ref 暴露为可写 state）
  (providerStore as unknown as { providers: RemoteProviderData[] }).providers = [
    makeProvider(),
  ];
  (modelsStore as unknown as { models: Model[] }).models = [makeModel()];
  return { modelsStore };
}

describe('ModelTable', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('应该渲染模型列表与添加按钮', async () => {
    seedStores();

    render(ModelTable);
    await nextTick();
    await waitFor(() => {
      expect(screen.getByText('测试模型')).toBeInTheDocument();
    });

    expect(screen.getByTestId('add-model-button')).toBeInTheDocument();
    expect(screen.getByTestId('filter-input')).toBeInTheDocument();
  });

  it('点击添加按钮应该跳转到 /model/add', async () => {
    seedStores();

    render(ModelTable);
    await fireEvent.click(screen.getByTestId('add-model-button'));

    expect(routerMock.push).toHaveBeenCalledWith('/model/add');
  });

  it('应该显示初始化错误提示', () => {
    const modelsStore = useModelsStore();
    (modelsStore as unknown as { initializationError: string }).initializationError =
      '数据源不可用';

    render(ModelTable);

    expect(screen.getByText('数据加载失败')).toBeInTheDocument();
    expect(screen.getByText('数据源不可用')).toBeInTheDocument();
  });

  it('编辑按钮应该打开编辑弹窗', async () => {
    seedStores();

    render(ModelTable);
    await nextTick();
    await waitFor(() => screen.getByText('测试模型'));

    const editButtons = screen.getAllByLabelText('操作');
    await fireEvent.click(editButtons[0]);

    await waitFor(() => {
      // 弹窗内渲染了表单（含提交按钮）
      expect(screen.getAllByText('提交').length).toBeGreaterThan(0);
    });
  });
});

describe('ModelSelect', () => {
  it('应该渲染全部模型选项', () => {
    render(ModelSelect, {
      props: {
        options: [
          { modelKey: 'a', modelName: '模型 A' },
          { modelKey: 'b', modelName: '模型 B' },
        ],
      },
    });

    expect(screen.getByTestId('model-option-a')).toBeInTheDocument();
    expect(screen.getByTestId('model-option-b')).toBeInTheDocument();
  });

  it('选择选项应该触发 update:value', async () => {
    const onUpdate = vi.fn();

    render(ModelSelect, {
      props: {
        options: [{ modelKey: 'a', modelName: '模型 A' }],
        'onUpdate:value': onUpdate,
      },
    });

    await fireEvent.click(screen.getByTestId('model-option-a'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('a');
    });
  });
});

describe('ModelConfigForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    (useModelProviderStore() as unknown as { providers: RemoteProviderData[] }).providers =
      [makeProvider()];
  });

  it('应该渲染新建模型表单与提交按钮', () => {
    render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK },
    });

    expect(screen.getByTestId('model-config-form')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByText('DeepSeek')).toBeInTheDocument();
  });

  it('供应商不存在时应该渲染错误提示', () => {
    render(ModelConfigForm, {
      props: { modelProviderKey: 'nonexistent' as ModelProviderKeyEnum },
    });

    expect(screen.getByTestId('provider-error')).toBeInTheDocument();
  });

  it('必填字段为空提交时应该显示校验错误且不调用 onFinish', async () => {
    const onFinish = vi.fn();

    render(ModelConfigForm, {
      props: {
        modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
        onFinish,
      },
    });

    await fireEvent.click(screen.getByTestId('submit-button'));
    await waitFor(
      () => {
        expect(screen.getAllByText('请输入昵称').length).toBeGreaterThan(0);
      },
      { timeout: 3000 },
    );
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('填写完整后提交应该调用 onFinish 并携带完整模型数据', async () => {
    const onFinish = vi.fn();

    render(ModelConfigForm, {
      props: {
        modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
        onFinish,
      },
    });

    // 填写文本字段
    const nicknameInput = screen
      .getByTestId('form-field-nickname')
      .querySelector('input')!;
    await fireEvent.update(nicknameInput, '我的模型');

    const apiKeyInput = screen
      .getByTestId('form-field-apiKey')
      .querySelector('input')!;
    await fireEvent.update(apiKeyInput, 'sk-xxx');

    const apiAddressInput = screen
      .getByTestId('form-field-apiAddress')
      .querySelector('input')!;
    await fireEvent.update(apiAddressInput, 'https://api.deepseek.com');

    // 选择模型
    await fireEvent.click(screen.getByTestId('model-option-deepseek-chat'));

    await fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(
      () => {
        expect(onFinish).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    const submitted = onFinish.mock.calls[0][0] as Model;
    expect(submitted.nickname).toBe('我的模型');
    expect(submitted.modelKey).toBe('deepseek-chat');
    expect(submitted.modelName).toBe('DeepSeek Chat');
    expect(submitted.providerKey).toBe(ModelProviderKeyEnum.DEEPSEEK);
    expect(submitted.id).toBeTruthy();
  });

  it('编辑模式提交应该保留原模型 id', async () => {
    const onFinish = vi.fn();
    const existing = makeModel();

    render(ModelConfigForm, {
      props: {
        modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
        modelParams: existing,
        onFinish,
      },
    });

    const nicknameInput = screen
      .getByTestId('form-field-nickname')
      .querySelector('input')!;
    expect((nicknameInput as HTMLInputElement).value).toBe('测试模型');

    await fireEvent.update(nicknameInput, '改名模型');
    await fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(
      () => {
        expect(onFinish).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );

    const submitted = onFinish.mock.calls[0][0] as Model;
    expect(submitted.id).toBe('model-1');
    expect(submitted.nickname).toBe('改名模型');
  });
});

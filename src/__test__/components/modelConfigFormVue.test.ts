/**
 * Vue ModelConfigForm 与 ModelSelect 组件测试
 *
 * 对应 React 版 ModelConfigForm.test.tsx 与 Model/components/ModelSelect.test.tsx 的行为断言：
 * 新建/编辑表单渲染、必填校验、提交回调、提供商切换重置/保留、Provider 缺失错误，
 * 以及模型单选器的选项渲染、错误红框与 change 事件。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    model: {
      modelNickname: '模型昵称',
      modelNicknameRequired: '请输入模型昵称',
      apiKey: 'API 密钥',
      apiKeyRequired: '请输入 API 密钥',
      apiAddress: 'API 地址',
      apiAddressRequired: '请输入 API 地址',
      modelRequired: '请选择模型',
      model: '模型',
    },
    common: { remark: '备注', submit: '提交' },
  }));

import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import ModelSelect from '@/pages/Model/components/ModelSelect.vue';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createDeepSeekProvider, createKimiProvider } from '@/__test__/helpers/fixtures/modelProvider';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

/** 组装供应商 store */
const setupProviders = () => {
  const providerStore = useModelProviderStore();
  providerStore.providers = [createDeepSeekProvider(), createKimiProvider()];
  return providerStore;
};

/** 构造编辑模式的模型参数 */
const existingModel = (): Model =>
  createMockModel({
    id: 'model-1',
    nickname: 'Existing Model',
    apiKey: 'existing-key',
    apiAddress: 'https://api.deepseek.com/v1',
    modelKey: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    isEnable: true,
  });

describe('ModelConfigForm（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('渲染新建模型表单', () => {
    setupProviders();
    render(ModelConfigForm, { props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK } });

    expect(screen.getByTestId('model-config-form')).toBeVisible();
  });

  it('渲染编辑模型表单', () => {
    setupProviders();
    render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK, modelParams: existingModel() },
    });

    expect(screen.getByTestId('model-config-form')).toBeVisible();
    expect((document.querySelector('#nickname') as HTMLInputElement).value).toBe('Existing Model');
    expect((document.querySelector('#apiKey') as HTMLInputElement).value).toBe('existing-key');
  });

  it('空表单提交显示必填校验错误', async () => {
    setupProviders();
    render(ModelConfigForm, { props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK } });

    await fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(screen.getAllByTestId('form-message-error').length).toBeGreaterThan(0));
  });

  it('清空已输入字段后显示校验错误', async () => {
    setupProviders();
    render(ModelConfigForm, { props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK } });

    const nickname = screen.getByRole('textbox', { name: /模型昵称/i });
    await fireEvent.update(nickname, 'test');
    await fireEvent.update(nickname, '');

    await waitFor(() => expect(screen.getAllByTestId('form-message-error').length).toBeGreaterThan(0));
  });

  it('新建模型提交成功后调用 onFinish 并回填派生字段', async () => {
    setupProviders();
    const onFinish = vi.fn();
    render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK, onFinish },
    });

    await fireEvent.update(screen.getByRole('textbox', { name: /模型昵称/i }), 'Test Model');
    await fireEvent.update(document.querySelector('#apiKey')!, 'test-api-key');
    // 选中模型（点击单选项标签）
    await fireEvent.click(screen.getByTestId('model-option-deepseek-chat'));
    await fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    const model = onFinish.mock.calls[0][0] as Model;
    expect(model.nickname).toBe('Test Model');
    expect(model.apiKey).toBe('test-api-key');
    expect(model.modelKey).toBe('deepseek-chat');
    expect(model.modelName).toBe('DeepSeek Chat');
    expect(model.providerKey).toBe(ModelProviderKeyEnum.DEEPSEEK);
    expect(model.providerName).toBe('DeepSeek');
    expect(model.id).toBeTruthy();
    expect(model.createdAt).toBeTruthy();
  });

  it('编辑模型提交成功后调用 onFinish', async () => {
    setupProviders();
    const onFinish = vi.fn();
    render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK, modelParams: existingModel(), onFinish },
    });

    await fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
    const model = onFinish.mock.calls[0][0] as Model;
    expect(model.id).toBe('model-1');
    expect(model.nickname).toBe('Existing Model');
  });

  it('新建模式下切换提供商时重置表单', async () => {
    setupProviders();
    const onFinish = vi.fn();
    const { rerender } = render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK, onFinish },
    });
    await fireEvent.update(screen.getByRole('textbox', { name: /模型昵称/i }), 'Test Model');

    await rerender({ modelProviderKey: ModelProviderKeyEnum.MOONSHOTAI, onFinish });

    // 表单仍在且值被还原
    expect(screen.getByTestId('model-config-form')).toBeVisible();
    expect((document.querySelector('#nickname') as HTMLInputElement).value).toBe('');
  });

  it('编辑模式下切换提供商时保留表单值', async () => {
    setupProviders();
    const { rerender } = render(ModelConfigForm, {
      props: { modelProviderKey: ModelProviderKeyEnum.DEEPSEEK, modelParams: existingModel() },
    });

    await rerender({ modelProviderKey: ModelProviderKeyEnum.MOONSHOTAI, modelParams: existingModel() });

    expect((document.querySelector('#nickname') as HTMLInputElement).value).toBe('Existing Model');
  });

  it('供应商不存在时显示错误提示', () => {
    render(ModelConfigForm, { props: { modelProviderKey: 'not-exist' } });

    expect(screen.getByTestId('provider-error')).toBeVisible();
  });
});

describe('ModelSelect（Vue 版）', () => {
  const options = [
    { modelKey: 'model-a', modelName: 'Model A' },
    { modelKey: 'model-b', modelName: 'Model B' },
  ];

  it('渲染所有选项', () => {
    render(ModelSelect, { props: { options } });

    expect(screen.getByTestId('model-option-model-a')).toBeVisible();
    expect(screen.getByTestId('model-option-model-b')).toBeVisible();
  });

  it('有校验错误时显示红色边框', () => {
    const { container } = render(ModelSelect, { props: { options, error: '请选择模型' } });

    const radioGroup = container.querySelector('[role="radiogroup"]')!;
    expect(radioGroup.className).toContain('border-red-500');
  });

  it('无校验错误时不显示红色边框', () => {
    const { container } = render(ModelSelect, { props: { options } });

    const radioGroup = container.querySelector('[role="radiogroup"]')!;
    expect(radioGroup.className).not.toContain('border-red-500');
  });

  it('选中值变化时发出 change 事件', async () => {
    const { emitted } = render(ModelSelect, { props: { options } });

    await fireEvent.click(screen.getByTestId('model-option-model-a'));

    await waitFor(() => expect(emitted()['change']).toBeTruthy());
    expect(emitted()['change'][0]).toEqual(['model-a']);
  });
});

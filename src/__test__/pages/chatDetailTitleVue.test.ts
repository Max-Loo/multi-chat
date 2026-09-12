/**
 * Vue DetailTitle 组件测试
 *
 * 对应 React 版 Title.test.tsx 的行为断言：
 * 模型不存在/已删除/禁用/正常状态的展示分支、名称格式、供应商 Logo 与 Tooltip 内容。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { render, screen } from '@testing-library/vue';

// Mock ProviderLogo，暴露 props 供断言
vi.mock('@/components/ProviderLogo/ProviderLogo.vue', () => ({
  ProviderLogo: {
    name: 'ProviderLogo',
    props: ['providerKey', 'providerName', 'size'],
    template: `<span data-testid="provider-logo" :data-key="providerKey" :data-name="providerName" :data-size="size" />`,
  },
}));

// Mock Tooltip，直接渲染 content 以便断言
vi.mock('@/components/ui-vue/tooltip', () => ({
  Tooltip: {
    name: 'Tooltip',
    props: ['content'],
    template: `<div data-testid="tooltip"><slot /><span data-testid="tooltip-content">{{ content }}</span></div>`,
  },
}));

// Mock 响应式 i18n 绑定
vi.mock('@/composables/useTranslation', () =>
  globalThis.__createI18nMockReturn({
    chat: {
      modelDeleted: '模型已删除',
      deleted: '已删除',
      disabled: '被禁用',
      supplier: '供应商',
      model: '模型',
      nickname: '昵称',
    },
  }));

import DetailTitle from '@/pages/Chat/components/Panel/Detail/DetailTitle.vue';
import { useModelStore } from '@/store/pinia/model';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockPanelChatModel } from '@/__test__/helpers/mocks/panelLayout';

describe('DetailTitle（Vue 版）', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('模型不存在时显示 destructive 徽章「模型已删除」', () => {
    const modelStore = useModelStore();
    modelStore.models = [];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('not-exist') } });

    const badge = screen.getByText('模型已删除');
    expect(badge).toBeVisible();
  });

  it('模型有昵称时显示「昵称 (模型名)」', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByText('我的助手 (gpt-4)')).toBeVisible();
  });

  it('模型没有昵称时仅显示模型名', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByText('gpt-4')).toBeVisible();
  });

  it('模型被标记为已删除时显示「已删除」徽章', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', isDeleted: true, providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByText('已删除')).toBeVisible();
  });

  it('模型 isEnable 为 false 时显示「被禁用」徽章', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', isEnable: false, providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.getByText('被禁用')).toBeVisible();
  });

  it('使用正确的 props 渲染 ProviderLogo', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    const logo = screen.getByTestId('provider-logo');
    expect(logo.getAttribute('data-key')).toBe('openai');
    expect(logo.getAttribute('data-name')).toBe('OpenAI');
    expect(logo.getAttribute('data-size')).toBe('24');
  });

  it('Tooltip 中显示完整模型信息', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toContain('OpenAI');
    expect(tooltip.textContent).toContain('gpt-4');
    expect(tooltip.textContent).toContain('我的助手');
  });

  it('Tooltip 中昵称为空时显示 "-"', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    const tooltip = screen.getByTestId('tooltip-content');
    expect(tooltip.textContent).toContain('昵称');
    expect(tooltip.textContent).toContain('-');
  });

  it('正常启用的模型不显示状态徽章', () => {
    const modelStore = useModelStore();
    modelStore.models = [
      createMockModel({ id: 'model-1', nickname: '我的助手', modelName: 'gpt-4', providerKey: 'openai' as never, providerName: 'OpenAI' }),
    ];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.queryByText('已删除')).toBeNull();
    expect(screen.queryByText('被禁用')).toBeNull();
    expect(screen.queryByText('模型已删除')).toBeNull();
  });

  it('模型不存在时优先显示「模型已删除」错误提示', () => {
    const modelStore = useModelStore();
    modelStore.models = [];

    render(DetailTitle, { props: { chatModel: createMockPanelChatModel('model-1') } });

    expect(screen.queryByTestId('tooltip-content')).toBeNull();
    expect(screen.getByText('模型已删除')).toBeVisible();
  });
});

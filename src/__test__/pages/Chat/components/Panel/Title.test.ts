/**
 * Title 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/components/Panel/Detail/Title.test.tsx
 * 与 components/DetailTitle.test.tsx，保留核心行为语义：
 * - 模型不存在 → destructive「模型已删除」Badge
 * - 名称格式：nickname (modelName) / 仅 modelName
 * - 状态 Badge：已删除（优先）/ 被禁用 / 正常无 Badge
 * - Tooltip 完整模型信息（昵称空显示 -）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

import Title from '@/pages/Chat/components/Panel/Detail/Title.vue';
import { createAppPinia } from '@/stores';
import { useModelStore } from '@/stores';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

const MODEL_ID = 'model-title-test-1';

/** 创建测试模型 */
function createModel(overrides?: Partial<Model>): Model {
  return {
    id: MODEL_ID,
    nickname: 'Test Nickname',
    modelName: 'Test Model',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'TestProvider',
    isDeleted: false,
    isEnable: true,
    createdAt: '2026-01-01 00:00:00',
    updateAt: '2026-01-01 00:00:00',
    modelKey: 'test-model-key',
    apiKey: 'test-api-key',
    apiAddress: 'https://test.api',
    ...overrides,
  };
}

/** 渲染 Title（可选注入模型记录） */
function renderTitle(model?: Model | null) {
  const pinia = createAppPinia();
  if (model !== null) {
    useModelStore(pinia).models = [model ?? createModel()];
  }
  const result = render(Title, {
    props: { chatModel: createMockPanelChatModel(MODEL_ID) },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia };
}

describe('Title（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该显示 destructive Badge 当模型不存在', () => {
    renderTitle(null);

    const badge = screen.getByText('模型已删除');
    expect(badge).toBeInTheDocument();
  });

  it('应该显示 "nickname (modelName)" 当模型有昵称', () => {
    renderTitle();

    expect(screen.getByText('Test Nickname (Test Model)')).toBeInTheDocument();
  });

  it('应该仅显示 modelName 当模型没有昵称', () => {
    renderTitle(createModel({ nickname: '' }));

    expect(screen.getByText('Test Model')).toBeInTheDocument();
  });

  it('应该显示已删除 Badge 当模型被标记为已删除', () => {
    renderTitle(createModel({ isDeleted: true }));

    expect(screen.getByText('已删除')).toBeInTheDocument();
  });

  it('应该显示已禁用 Badge 当模型 isEnable 为 false', () => {
    renderTitle(createModel({ isEnable: false }));

    expect(screen.getByText('被禁用')).toBeInTheDocument();
  });

  it('正常启用模型不应显示状态 Badge', () => {
    renderTitle();

    expect(screen.queryByText('已删除')).not.toBeInTheDocument();
    expect(screen.queryByText('被禁用')).not.toBeInTheDocument();
  });

  it('当模型同时标记为已删除和已禁用时，应优先显示已删除 Badge', () => {
    renderTitle(createModel({ isDeleted: true, isEnable: false }));

    expect(screen.getByText('已删除')).toBeInTheDocument();
    expect(screen.queryByText('被禁用')).not.toBeInTheDocument();
  });

  it('应该在 Tooltip 中显示完整模型信息', async () => {
    renderTitle();
    const user = userEvent.setup();

    await user.hover(screen.getByText('Test Nickname (Test Model)'));

    expect(await screen.findByText('供应商: TestProvider')).toBeInTheDocument();
    expect(screen.getByText('模型: Test Model')).toBeInTheDocument();
    expect(screen.getByText('昵称: Test Nickname')).toBeInTheDocument();
  });

  it('应该在 Tooltip 中昵称为空时显示 "-"', async () => {
    renderTitle(createModel({ nickname: '' }));
    const user = userEvent.setup();

    await user.hover(screen.getByText('Test Model'));

    expect(await screen.findByText('昵称: -')).toBeInTheDocument();
  });
});

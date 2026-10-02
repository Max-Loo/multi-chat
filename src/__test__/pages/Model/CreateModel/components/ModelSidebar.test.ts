/**
 * ModelSidebar 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/CreateModel/components/ModelSidebar.test.tsx，
 * 保留核心行为语义：
 * - 渲染所有供应商 / 空列表
 * - 选中状态（aria-current）
 * - 文本搜索过滤（防抖）
 * - 点击供应商触发 update:modelValue
 * - 返回按钮导航
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';

const mocks = vi.hoisted(() => ({
  responsive: globalThis.__createResponsiveMock(),
  routerPush: vi.fn(),
}));

vi.mock('@/composables/useResponsive', () => ({
  useResponsive: () => mocks.responsive,
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

import ModelSidebar from '@/pages/Model/CreateModel/components/ModelSidebar.vue';
import { createAppPinia, useModelProviderStore } from '@/stores';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 创建测试供应商 */
const createProvider = (
  providerKey: ModelProviderKeyEnum,
  providerName: string,
): RemoteProviderData => ({
  providerKey,
  providerName,
  api: 'https://api.example.com',
  models: [],
});

/** 渲染 ModelSidebar */
function renderSidebar(modelValue = ModelProviderKeyEnum.DEEPSEEK) {
  const pinia = createAppPinia();
  const providerStore = useModelProviderStore(pinia);
  providerStore.providers = [
    createProvider(ModelProviderKeyEnum.DEEPSEEK, 'DeepSeek'),
    createProvider(ModelProviderKeyEnum.MOONSHOTAI, 'Moonshot AI'),
    createProvider(ModelProviderKeyEnum.ZHIPUAI, '智谱 AI'),
  ];
  const result = render(ModelSidebar, {
    props: { modelValue },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia, providerStore };
}

describe('ModelSidebar（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该渲染所有供应商', () => {
    renderSidebar();

    expect(screen.getByTitle('DeepSeek')).toBeInTheDocument();
    expect(screen.getByTitle('Moonshot AI')).toBeInTheDocument();
    expect(screen.getByTitle('智谱 AI')).toBeInTheDocument();
  });

  it('应该显示选中状态', () => {
    renderSidebar();

    expect(screen.getByTitle('DeepSeek')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('应该只显示一个选中状态', () => {
    const { container } = renderSidebar();

    expect(screen.getByLabelText('模型供应商导航')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  });

  it('应该渲染搜索输入框', () => {
    renderSidebar();

    expect(
      screen.getByPlaceholderText('搜索模型'),
    ).toBeInTheDocument();
  });

  it('应该支持搜索过滤供应商列表', async () => {
    vi.useFakeTimers();
    renderSidebar();

    await fireEvent.update(screen.getByPlaceholderText('搜索模型'), 'deep');

    // 防抖 200ms 后过滤生效
    await vi.advanceTimersByTimeAsync(300);

    expect(screen.getByTitle('DeepSeek')).toBeInTheDocument();
    expect(screen.queryByTitle('Moonshot AI')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('点击供应商应该触发 update:modelValue', async () => {
    const { emitted } = renderSidebar();

    await fireEvent.click(screen.getByTitle('Moonshot AI'));

    expect(emitted('update:modelValue')).toEqual([
      [ModelProviderKeyEnum.MOONSHOTAI],
    ]);
  });

  it('应该渲染返回按钮并导航到列表页', async () => {
    renderSidebar();

    // 返回按钮无 aria-label，通过 svg 箭头按钮查找（侧边栏头部第一个按钮）
    const nav = screen.getByLabelText('模型供应商导航');
    const backButton = nav.querySelector('button');
    expect(backButton).toBeInTheDocument();

    await fireEvent.click(backButton as HTMLElement);
    expect(mocks.routerPush).toHaveBeenCalledWith('/model/table');
  });
});

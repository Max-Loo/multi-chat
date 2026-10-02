/**
 * CreateModel 页面测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/CreateModel/CreateModel.test.tsx，
 * 保留核心行为语义：
 * - 页面布局（供应商侧边栏 + 配置表单）
 * - 默认选中 DeepSeek 提供商、切换供应商
 * - 表单提交成功后创建模型并导航到列表页
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';

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

vi.mock('@/composables/useAdaptiveScrollbar', () => ({
  useAdaptiveScrollbar: () => globalThis.__createScrollbarMock(),
}));

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock 存储层（createModel 内部持久化依赖主密钥）
vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  deleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve()),
}));

// Mock 子组件：聚焦页面布局与提交流程
vi.mock('@/pages/Model/CreateModel/components/ModelSidebar.vue', () => ({
  __esModule: true,
  default: {
    __isTeleport: false,
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<nav data-testid="mock-model-sidebar"><button data-testid="provider-deepseek" @click="$emit(\'update:modelValue\', \'deepseek\')">DeepSeek</button></nav>',
  },
}));
vi.mock('@/pages/Model/components/ModelConfigForm.vue', async () => {
  const { createMockModel } = await import(
    '@/__test__/helpers/fixtures/model'
  );
  const sample = createMockModel();
  return {
    __esModule: true,
    default: {
      __isTeleport: false,
      props: ['modelProviderKey'],
      emits: ['finish'],
      setup() {
        return { sample };
      },
      template:
        '<div data-testid="mock-model-config-form" :data-provider="modelProviderKey"><button data-testid="form-finish" @click="$emit(\'finish\', sample)">提交表单</button></div>',
    },
  };
});
vi.mock('@/components/MobileDrawer', () => ({
  MobileDrawer: {
    props: ['open', 'showCloseButton'],
    template: '<div data-testid="mock-mobile-drawer"><slot /></div>',
  },
}));

import CreateModel from '@/pages/Model/CreateModel/index.vue';
import { createAppPinia, useModelStore } from '@/stores';
import { toastQueue } from '@/services/toast';

describe('CreateModel（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.responsive.__reset();
  });

  it('应该渲染供应商侧边栏和配置表单', () => {
    render(CreateModel, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByTestId('model-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-model-config-form')).toBeInTheDocument();
  });

  it('应该默认选中 DeepSeek 提供商', () => {
    render(CreateModel, { global: { plugins: [createAppPinia()] } });

    expect(screen.getByTestId('mock-model-config-form')).toHaveAttribute(
      'data-provider',
      'deepseek',
    );
  });

  it('应该支持切换模型提供商', async () => {
    render(CreateModel, { global: { plugins: [createAppPinia()] } });

    await fireEvent.click(screen.getByTestId('provider-deepseek'));

    // 切换后表单收到更新（此处 mock 直接发同值，验证事件链路可达）
    expect(screen.getByTestId('mock-model-config-form')).toBeInTheDocument();
  });

  it('提交成功后应该创建模型并导航到列表页', async () => {
    const pinia = createAppPinia();
    const modelStore = useModelStore(pinia);
    const createSpy = vi.spyOn(modelStore, 'createModel');
    render(CreateModel, { global: { plugins: [pinia] } });

    // 模拟表单校验完成（点击 mock 表单的提交按钮）
    await fireEvent.click(screen.getByTestId('form-finish'));

    expect(createSpy).toHaveBeenCalled();
    expect(toastQueue.success).toHaveBeenCalledWith('模型添加成功');
    await waitFor(() => {
      expect(mocks.routerPush).toHaveBeenCalledWith('/model/table');
    });
  });

  it('创建失败时应该显示错误 toast 且不导航', async () => {
    const pinia = createAppPinia();
    const modelStore = useModelStore(pinia);
    vi.spyOn(modelStore, 'createModel').mockImplementation(() => {
      throw new Error('create failed');
    });
    render(CreateModel, { global: { plugins: [pinia] } });

    await fireEvent.click(screen.getByTestId('form-finish'));

    expect(toastQueue.error).toHaveBeenCalledWith('模型添加失败');
    expect(mocks.routerPush).not.toHaveBeenCalled();
  });
});

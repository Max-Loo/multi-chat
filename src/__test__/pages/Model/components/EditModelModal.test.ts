/**
 * EditModelModal 组件测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Model/components/EditModelModal.test.tsx，
 * 保留核心行为语义：
 * - 弹窗打开条件（isModalOpen 显式控制 / modelProviderKey 隐式控制）
 * - 弹窗标题与描述
 * - 编辑提交成功后关闭弹窗
 * - Esc 关闭
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import { nextTick } from 'vue';

// Mock 存储层（editModel 内部持久化依赖主密钥，与 store 测试一致）
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

vi.mock('@/composables/useTranslation', async () => {
  const { createUseTranslationMock } = await import(
    '@/__test__/helpers/mocks/vueI18n'
  );
  return { useTranslation: createUseTranslationMock() };
});

vi.mock('@/services/toast', () => globalThis.__createToastQueueModuleMock());

// Mock 表单：EditModelModal 测试聚焦弹窗开关与提交流程
vi.mock('@/pages/Model/components/ModelConfigForm.vue', async () => {
  const { createMockModel } = await import(
    '@/__test__/helpers/fixtures/model'
  );
  const sample = createMockModel();
  return {
    __esModule: true,
    default: {
      __isTeleport: false,
      props: ['modelProviderKey', 'modelParams'],
      emits: ['finish'],
      setup() {
        return { sample };
      },
      template:
        '<div data-testid="mock-model-config-form" :data-provider="modelProviderKey"><button data-testid="form-finish" @click="$emit(\'finish\', sample)">提交表单</button></div>',
    },
  };
});

import EditModelModal from '@/pages/Model/ModelTable/components/EditModelModal.vue';
import { createAppPinia, useModelStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

/** 渲染 EditModelModal */
function renderModal(options?: {
  isModalOpen?: boolean;
  modelProviderKey?: ModelProviderKeyEnum;
  modelParams?: ReturnType<typeof createMockModel>;
}) {
  const pinia = createAppPinia();
  const result = render(EditModelModal, {
    props: {
      isModalOpen: options?.isModalOpen,
      modelProviderKey: options?.modelProviderKey,
      modelParams: options?.modelParams,
    },
    global: { plugins: [pinia] },
  });
  return { ...result, pinia };
}

describe('EditModelModal（Vue 版）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('当 isModalOpen 为 true 时应该显示弹窗', async () => {
    renderModal({
      isModalOpen: true,
      modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
      modelParams: createMockModel(),
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('编辑模型')).toBeInTheDocument();
    expect(screen.getByText('编辑模型的配置信息，包括昵称、API 密钥和地址等')).toBeInTheDocument();
  });

  it('当无显式 isModalOpen 但有 modelProviderKey 时应该显示弹窗', async () => {
    renderModal({ modelProviderKey: ModelProviderKeyEnum.DEEPSEEK });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('当 isModalOpen 为 false 时不显示弹窗', async () => {
    renderModal({ isModalOpen: false, modelProviderKey: ModelProviderKeyEnum.DEEPSEEK });
    await nextTick();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('应该渲染配置表单', async () => {
    renderModal({
      isModalOpen: true,
      modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
      modelParams: createMockModel(),
    });

    await screen.findByRole('dialog');
    expect(screen.getByTestId('mock-model-config-form')).toBeInTheDocument();
  });

  it('编辑提交成功后应该关闭弹窗并显示成功 toast', async () => {
    const pinia = createAppPinia();
    const modelStore = useModelStore(pinia);
    const editSpy = vi.spyOn(modelStore, 'editModel');
    const { emitted } = render(EditModelModal, {
      props: {
        isModalOpen: true,
        modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
        modelParams: createMockModel(),
      },
      global: { plugins: [pinia] },
    });
    await screen.findByRole('dialog');

    await fireEvent.click(screen.getByTestId('form-finish'));

    expect(editSpy).toHaveBeenCalled();
    expect(toastQueue.success).toHaveBeenCalledWith('模型编辑成功');
    expect(emitted('cancel')).toHaveLength(1);
  });

  it('编辑提交失败时应该显示错误 toast 并关闭弹窗', async () => {
    const pinia = createAppPinia();
    const modelStore = useModelStore(pinia);
    vi.spyOn(modelStore, 'editModel').mockImplementation(() => {
      throw new Error('edit failed');
    });
    const { emitted } = render(EditModelModal, {
      props: {
        isModalOpen: true,
        modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
        modelParams: createMockModel(),
      },
      global: { plugins: [pinia] },
    });
    await screen.findByRole('dialog');

    await fireEvent.click(screen.getByTestId('form-finish'));

    expect(toastQueue.error).toHaveBeenCalledWith('模型编辑失败');
    expect(emitted('cancel')).toHaveLength(1);
  });

  it('点击关闭按钮应该关闭弹窗', async () => {
    const { emitted } = renderModal({
      isModalOpen: true,
      modelProviderKey: ModelProviderKeyEnum.DEEPSEEK,
    });
    await screen.findByRole('dialog');

    // DialogContent 右上角关闭按钮
    await fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(emitted('cancel')).toHaveLength(1);
  });
});

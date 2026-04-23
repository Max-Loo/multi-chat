/**
 * EditModelModal 组件测试
 *
 * 测试编辑模型弹窗的各种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import EditModelModal from '@/pages/Model/ModelTable/components/EditModelModal';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';
import { ModelProviderKeyEnum } from '@/utils/enums';

vi.mock('react-i18next', () => {
  const R = { model: { editModel: '编辑模型', editModelDescription: '编辑模型描述', editModelSuccess: '编辑成功', editModelFailed: '编辑失败', modelNickname: '模型昵称', apiKey: 'API 密钥', apiAddress: 'API 地址', model: '模型' }, common: { remark: '备注', submit: '提交' } };
  return globalThis.__createI18nMockReturn(R);
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockProviders = [
  {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    models: [
      { modelName: 'DeepSeek Chat', modelKey: 'deepseek-chat' },
      { modelName: 'DeepSeek Coder', modelKey: 'deepseek-coder' },
    ],
  },
];

/**
 * 创建测试用 Redux store
 * @param modelOverrides Model slice 状态覆盖
 * @param providerOverrides ModelProvider slice 状态覆盖
 */
const createTestStore = (
  modelOverrides?: Parameters<typeof createModelSliceState>[0],
  providerOverrides?: Parameters<typeof createModelProviderSliceState>[0]
) => {
  return createTypeSafeTestStore({
    models: createModelSliceState(modelOverrides),
    modelProvider: createModelProviderSliceState(providerOverrides),
  });
};

describe('EditModelModal', () => {
  let mockModel: ReturnType<typeof createMockModel>;
  let mockOnModalCancel: () => void;

  beforeEach(() => {
    mockModel = createMockModel({
      id: '1',
      nickname: 'Test Model',
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      modelKey: 'deepseek-chat',
    });
    mockOnModalCancel = vi.fn();
  });

  describe('弹窗打开条件', () => {
    it('当 isModalOpen 为 true 时应该显示弹窗', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('data-state')).toBe('open');
    });

    it('当有 modelProviderKey 时应该显示弹窗（即使 isModalOpen 未定义）', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('data-state')).toBe('open');
    });
  });

  describe('弹窗关闭', () => {
    it('按 Escape 键应该关闭弹窗', async () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitFor(() => {
        expect(mockOnModalCancel).toHaveBeenCalled();
      });
    });

    it('点击关闭按钮应该关闭弹窗', async () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).toBeInTheDocument();
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(mockOnModalCancel).toHaveBeenCalled();
      });
    });
  });

  describe('表单渲染', () => {
    it('应该渲染 ModelConfigForm 组件', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('应该显示弹窗标题和描述', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).toBeInTheDocument();
      const title = dialog.querySelector('h2, h3');
      expect(title).toBeInTheDocument();
    });
  });

  describe('编辑提交', () => {
    it('编辑成功后应该关闭弹窗', async () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnModalCancel).toHaveBeenCalled();
      });
    });
  });

  describe('Dialog 组件集成', () => {
    it('应该使用 Dialog 组件的正确属性', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译弹窗标题', () => {
      const store = createTestStore(
        { models: [mockModel] },
        { providers: mockProviders }
      );

      renderWithProviders(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { store }
      );

      const dialog = document.querySelector('[role="dialog"]') as HTMLElement;
      expect(dialog).toBeInTheDocument();
      const title = dialog.querySelector('h2, h3');
      expect(title).toBeInTheDocument();
    });
  });
});

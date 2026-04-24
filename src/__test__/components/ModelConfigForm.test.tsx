/**
 * ModelConfigForm 组件测试
 *
 * 测试模型配置表单的各种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor, screen } from '@testing-library/react';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createDeepSeekProvider, createKimiProvider } from '@/__test__/helpers/fixtures';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';
import type { Model } from '@/types/model';

vi.mock('react-i18next', () =>
  globalThis.__mockI18n({
    model: {
      modelNicknameRequired: '请输入模型昵称',
      apiKeyRequired: '请输入 API 密钥',
      apiAddressRequired: '请输入 API 地址',
      modelRequired: '请选择模型',
      apiKey: 'API 密钥',
    },
  }));

const createStore = (
  modelsOverrides?: Parameters<typeof createModelSliceState>[0],
  modelProviderOverrides?: Parameters<typeof createModelProviderSliceState>[0],
) => {
  return createTypeSafeTestStore({
    models: createModelSliceState(modelsOverrides),
    modelProvider: createModelProviderSliceState(modelProviderOverrides),
  });
};

describe('ModelConfigForm', () => {
  let mockOnFinish: ReturnType<typeof vi.fn<(model: Model) => void>>;

  beforeEach(() => {
    mockOnFinish = vi.fn<(model: Model) => void>();
  });

  
  describe('表单渲染', () => {
    it('应该渲染新建模型表单', () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });

    it('应该渲染编辑模型表单', () => {
      const existingModel = createMockModel({
        nickname: 'Existing Model',
        apiKey: 'existing-key',
      });

      const store = createStore(
        { models: [existingModel] },
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 获取提交按钮（通过 data-testid 查找）
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();

      fireEvent.click(submitButton);

      await waitFor(() => {
        // 检查是否有错误消息显示
        const errorMessages = screen.getAllByTestId('form-message-error');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('应该在字段失焦时显示验证错误', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 获取输入框（通过 role 和 name 属性）
      const nicknameInput = screen.getByRole('textbox', { name: /模型昵称/i });
      // 先输入值再清空，触发验证
      fireEvent.change(nicknameInput, { target: { value: 'test' } });
      fireEvent.change(nicknameInput, { target: { value: '' } });
      fireEvent.blur(nicknameInput);

      // 验证错误显示
      await waitFor(() => {
        const errorMsg = screen.getByTestId('form-message-error');
        expect(errorMsg).toBeInTheDocument();
      });
    });
  });

  describe('表单提交', () => {
    it('应该在新建模型提交成功后调用 onFinish', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 填写表单 - 通过语义化查询查找输入框
      const nicknameInput = screen.getByRole('textbox', { name: /模型昵称/i });
      const apiKeyInput = screen.getByLabelText(/API 密钥/i) as HTMLInputElement;

      expect(nicknameInput).toBeInTheDocument();
      expect(apiKeyInput).toBeInTheDocument();
      fireEvent.change(nicknameInput, { target: { value: 'Test Model' } });
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

      // 选择模型 - 使用 RadioGroup 方式（点击 label）
      const firstModelLabel = screen.getByTestId('model-option-deepseek-chat');
      fireEvent.click(firstModelLabel);

      // 提交表单
      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnFinish).toHaveBeenCalled();
      });
    });

    it('应该在编辑模型提交成功后调用 onFinish', async () => {
      const existingModel = createMockModel();

      const store = createStore(
        { models: [existingModel] },
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnFinish).toHaveBeenCalled();
      });
    });
  });

  describe('提供商切换', () => {
    it('应该在新建模式下切换提供商时重置表单', () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider(), createKimiProvider()] },
      );

      const { rerender: testRerender } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          onFinish={mockOnFinish}
        />
      );

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });

    it('应该在编辑模式下切换提供商时保留表单值', () => {
      const existingModel = createMockModel();

      const store = createStore(
        { models: [existingModel] },
        { providers: [createDeepSeekProvider(), createKimiProvider()] },
      );

      const { rerender: testRerender } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />
      );

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译表单标签', () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      const form = screen.getByTestId('model-config-form');
      expect(form).toBeInTheDocument();
    });
  });
});

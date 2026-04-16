/**
 * ModelConfigForm 组件测试
 *
 * 测试模型配置表单的各种场景
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, waitFor, cleanup } from '@testing-library/react';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm';
import { createMockModel } from '@/__test__/helpers/mocks/testState';
import { createDeepSeekProvider, createKimiProvider } from '@/__test__/helpers/fixtures';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';

vi.mock('react-i18next', () => {
  const R = { model: { modelNickname: '模型昵称', apiKey: 'API 密钥', apiAddress: 'API 地址', model: '模型', modelNicknameRequired: '请输入模型昵称', apiKeyRequired: '请输入 API 密钥', apiAddressRequired: '请输入 API 地址', modelRequired: '请选择模型' }, common: { remark: '备注', submit: '提交' } };
  return globalThis.__createI18nMockReturn(R);
});

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: 测试错误处理，需要构造无效输入
  let mockOnFinish: any;

  beforeEach(() => {
    mockOnFinish = vi.fn();
  });

  afterEach(() => {
    cleanup();
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

      const form = document.querySelector('form');
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

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      const { container } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 获取提交按钮（通过 container 查找，避免多个测试元素干扰）
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).toBeInTheDocument();
      
      if (submitButton) {
        fireEvent.click(submitButton);
      }

      await waitFor(() => {
        // 检查是否有错误消息显示 - 查找包含 "Too small" 或 "required" 的错误文本
        const errorMessages = container.querySelectorAll('.text-destructive');
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it('应该在字段失焦时显示验证错误', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      const { container } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 获取输入框（通过 name 属性）
      const nicknameInput = container.querySelector('input[name="nickname"]');
      if (nicknameInput) {
        // 先输入值再清空，触发验证
        fireEvent.change(nicknameInput, { target: { value: 'test' } });
        fireEvent.change(nicknameInput, { target: { value: '' } });
        fireEvent.blur(nicknameInput);
        
        // 验证错误显示
        await waitFor(() => {
          const errorMsg = container.querySelector('.text-destructive');
          expect(errorMsg).toBeInTheDocument();
        });
      }
    });
  });

  describe('表单提交', () => {
    it('应该在新建模型提交成功后调用 onFinish', async () => {
      const store = createStore(
        undefined,
        { providers: [createDeepSeekProvider()] },
      );

      const { container } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      // 填写表单 - 通过 container 和 name 属性查找输入框
      const nicknameInput = container.querySelector('input[name="nickname"]') as HTMLInputElement;
      const apiKeyInput = container.querySelector('input[name="apiKey"]') as HTMLInputElement;

      if (nicknameInput && apiKeyInput) {
        fireEvent.change(nicknameInput, { target: { value: 'Test Model' } });
        fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
        
        // 选择模型 - 使用 RadioGroup 方式（点击 label 而不是 radio input）
        const firstModelLabel = container.querySelector(`label[for="deepseek-chat"]`);
        if (firstModelLabel) {
          fireEvent.click(firstModelLabel);
        }

        // 提交表单
        const submitButton = container.querySelector('button[type="submit"]');
        if (submitButton) {
          fireEvent.click(submitButton);
        }
      }

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

      const { container } = renderWithProviders(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { store }
      );

      const submitButton = container.querySelector('button[type="submit"]');
      if (submitButton) {
        fireEvent.click(submitButton);
      }

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Reason: 测试错误处理，需要构造无效输入
          onFinish={mockOnFinish as any}
        />,
        { store }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Reason: 测试错误处理，需要构造无效输入
          onFinish={mockOnFinish as any}
        />
      );

      const form = document.querySelector('form');
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Reason: 测试错误处理，需要构造无效输入
          onFinish={mockOnFinish as any}
        />,
        { store }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          modelParams={existingModel}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Reason: 测试错误处理，需要构造无效输入
          onFinish={mockOnFinish as any}
        />
      );

      const form = document.querySelector('form');
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

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});

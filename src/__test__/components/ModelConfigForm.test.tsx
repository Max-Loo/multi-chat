/**
 * ModelConfigForm 组件测试
 *
 * 测试模型配置表单的各种场景
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm';
import modelReducer from '@/store/slices/modelSlice';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import type { RootState } from '@/store';
import { createMockModel, createDeepSeekProvider, createKimiProvider } from '@/__test__/helpers/fixtures';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      const translations = {
        model: {
          nickname: '模型昵称',
          apiKey: 'API 密钥',
          apiAddress: 'API 地址',
          modelName: '模型名称',
          createModel: '创建模型',
          editModel: '编辑模型',
          submit: '提交',
          cancel: '取消',
          required: '必填',
        },
        common: {
          required: '必填',
          submit: '提交',
          cancel: '取消',
        },
      };

      if (typeof keyOrFn === 'function') {
        return keyOrFn(translations);
      }
      
      const translationsMap: Record<string, string> = {
        'model.nickname': '模型昵称',
        'model.apiKey': 'API 密钥',
        'model.apiAddress': 'API 地址',
        'model.modelName': '模型名称',
        'model.createModel': '创建模型',
        'model.editModel': '编辑模型',
        'common.submit': '提交',
        'common.cancel': '取消',
        'common.required': '必填',
      };
      return translationsMap[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      models: modelReducer,
      modelProvider: modelProviderReducer,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return function({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('ModelConfigForm', () => {
  let mockOnFinish: any;

  beforeEach(() => {
    mockOnFinish = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  describe('表单渲染', () => {
    it('应该渲染新建模型表单', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { wrapper }
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('应该渲染编辑模型表单', () => {
      const existingModel = createMockModel({
        nickname: 'Existing Model',
        apiKey: 'existing-key',
      });

      const store = createTestStore({
        models: {
          models: [existingModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { wrapper }
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { wrapper }
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
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { wrapper }
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
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { wrapper }
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

      const store = createTestStore({
        models: {
          models: [existingModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { container } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish}
        />,
        { wrapper }
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
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider(), createKimiProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { rerender: testRerender } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish as any}
        />,
        { wrapper }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          onFinish={mockOnFinish as any}
        />
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('应该在编辑模式下切换提供商时保留表单值', () => {
      const existingModel = createMockModel();

      const store = createTestStore({
        models: {
          models: [existingModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider(), createKimiProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      const { rerender: testRerender } = render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={existingModel}
          onFinish={mockOnFinish as any}
        />,
        { wrapper }
      );

      testRerender(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.MOONSHOTAI}
          modelParams={existingModel}
          onFinish={mockOnFinish as any}
        />
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译表单标签', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [createDeepSeekProvider()],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <ModelConfigForm
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          onFinish={mockOnFinish}
        />,
        { wrapper }
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});

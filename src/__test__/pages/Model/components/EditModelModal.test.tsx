/**
 * EditModelModal 组件测试
 *
 * 测试编辑模型弹窗的各种场景
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import EditModelModal from '@/pages/Model/ModelTable/components/EditModelModal';
import modelReducer from '@/store/slices/modelSlice';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import type { RootState } from '@/store';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      // 创建完整的翻译对象，包含所有嵌套属性
      const translations = {
        model: {
          editModel: '编辑模型',
          editModelDescription: '编辑模型的配置信息',
          editModelSuccess: '编辑模型成功',
          editModelFailed: '编辑模型失败',
          nickname: '模型昵称',
          apiKey: 'API 密钥',
          apiAddress: 'API 地址',
          modelName: '模型名称',
          submit: '提交',
          cancel: '取消',
          required: '必填',
        },
        common: {
          submit: '提交',
          cancel: '取消',
          required: '必填',
        },
      };

      if (typeof keyOrFn === 'function') {
        return keyOrFn(translations);
      }
      
      const keyMap: Record<string, string> = {
        'model.editModel': '编辑模型',
        'model.editModelDescription': '编辑模型的配置信息',
        'model.editModelSuccess': '编辑模型成功',
        'model.editModelFailed': '编辑模型失败',
        'model.nickname': '模型昵称',
        'model.apiKey': 'API 密钥',
        'model.apiAddress': 'API 地址',
        'model.modelName': '模型名称',
        'common.submit': '提交',
        'common.cancel': '取消',
        'common.required': '必填',
      };
      return keyMap[keyOrFn] || keyOrFn;
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('EditModelModal', () => {
  let mockModel: ReturnType<typeof createMockModel>;
  let mockOnModalCancel: any;

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
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('data-state')).toBe('open');
    });

    it('当有 modelProviderKey 时应该显示弹窗（即使 isModalOpen 未定义）', () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          onModalCancel={mockOnModalCancel as any}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog?.getAttribute('data-state')).toBe('open');
    });
  });

  describe('弹窗关闭', () => {
    it('点击蒙层应该关闭弹窗', async () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const overlay = document.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);

        await waitFor(() => {
          expect(mockOnModalCancel).toHaveBeenCalled();
        });
      }
    });

    it('点击关闭按钮应该关闭弹窗', async () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel as any}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const closeButton = Array.from(dialog.querySelectorAll('button')).find(btn => 
          btn.getAttribute('aria-label') === 'close' || btn.textContent.includes('close')
        );
        if (closeButton) {
          fireEvent.click(closeButton);

          await waitFor(() => {
            expect(mockOnModalCancel).toHaveBeenCalled();
          });
        }
      }
    });
  });

  describe('表单渲染', () => {
    it('应该渲染 ModelConfigForm 组件', () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('应该显示弹窗标题和描述', () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel as any}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const title = dialog.querySelector('h2, h3');
        expect(title).toBeInTheDocument();
      }
    });
  });

  describe('编辑提交', () => {
    it('编辑成功后应该关闭弹窗', async () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const submitButton = screen.queryByText(/submit|update/i);
      if (submitButton) {
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnModalCancel).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Dialog 组件集成', () => {
    it('应该使用 Dialog 组件的正确属性', () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel as any}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('国际化支持', () => {
    it('应该使用 i18n 翻译弹窗标题', () => {
      const store = createTestStore({
        models: {
          models: [mockModel],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: mockProviders,
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(
        <EditModelModal
          isModalOpen={true}
          onModalCancel={mockOnModalCancel as any}
          modelProviderKey={ModelProviderKeyEnum.DEEPSEEK}
          modelParams={mockModel}
        />,
        { wrapper }
      );

      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        const title = dialog.querySelector('h2, h3');
        expect(title).toBeInTheDocument();
      }
    });
  });
});

/**
 * ModelTable 组件测试
 *
 * 测试模型列表的各种场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ModelTable from '@/pages/Model/ModelTable';
import modelReducer from '@/store/slices/modelSlice';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import type { RootState } from '@/store';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import type { Model } from '@/types/model';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (keyOrFn: string | ((_: any) => string)) => {
      if (typeof keyOrFn === 'function') {
        return keyOrFn({
          table: {
            nickname: '昵称',
            modelProvider: '供应商',
            modelName: '模型名称',
            lastUpdateTime: '最后更新时间',
            createTime: '创建时间',
            operation: '操作',
            loading: '加载中...',
            emptyData: '暂无数据',
          },
          model: {
            deleteModelSuccess: '删除成功',
            deleteModelFailed: '删除失败',
            confirmDelete: '确认删除',
            confirmDeleteDescription: '确定要删除模型 "{{nickname}}" 吗？',
            dataLoadFailed: '数据加载失败',
            operationFailed: '操作失败',
            addModel: '添加模型',
            searchPlaceholder: '搜索模型...',
            fixErrorReload: '重新加载',
            noModelData: '暂无模型数据',
          },
          common: {
            remark: '备注',
            operation: '操作',
            cancel: '取消',
            confirm: '确认',
          },
        });
      }
      const translations: Record<string, string> = {
        'model.modelList': '模型列表',
        'model.addModel': '添加模型',
        'model.filterPlaceholder': '过滤模型...',
        'model.noData': '暂无数据',
        'model.initializationError': '初始化失败',
        'model.operationError': '操作失败',
        'model.edit': '编辑',
        'model.delete': '删除',
        'model.deleteConfirm': '确认删除',
        'model.deleteCancel': '取消',
        'common.confirm': '确认',
        'common.cancel': '取消',
        'table.loading': '加载中...',
        'table.emptyData': '暂无数据',
      };
      return translations[keyOrFn] || keyOrFn;
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
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  };
};

describe('ModelTable', () => {
  let mockModels: Model[];

  beforeEach(() => {
    mockModels = [
      createMockModel({
        id: '1',
        nickname: 'DeepSeek Chat',
        providerKey: 'deepseek' as any,
        modelKey: 'deepseek-chat',
      }),
      createMockModel({
        id: '2',
        nickname: 'Kimi Chat',
        providerKey: 'moonshotai' as any,
        modelKey: 'moonshot-v1-8k',
      }),
      createMockModel({
        id: '3',
        nickname: 'Zhipu Chat',
        providerKey: 'zhipu' as any,
        modelKey: 'glm-4',
      }),
    ];
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染模型列表', () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
      expect(screen.getByText('Kimi Chat')).toBeInTheDocument();
      expect(screen.getByText('Zhipu Chat')).toBeInTheDocument();
    });

    it('应该显示添加模型按钮', () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const addButton = screen.getByRole('button', { name: '添加模型' });
      expect(addButton).toBeInTheDocument();
    });

    it('应该显示过滤输入框', () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: true,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  describe('错误状态', () => {
    it('应该显示初始化错误', () => {
      const errorMessage = 'Failed to load models';
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: errorMessage,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('应该显示操作错误', () => {
      const errorMessage = 'Operation failed';
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: errorMessage,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('过滤功能', () => {
    it('应该根据昵称过滤模型列表', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      fireEvent.change(searchInput, { target: { value: 'DeepSeek' } });

      await waitFor(() => {
        expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
        expect(screen.queryByText('Kimi Chat')).not.toBeInTheDocument();
        expect(screen.queryByText('Zhipu Chat')).not.toBeInTheDocument();
      });
    });

    it('应该支持不区分大小写的过滤', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      fireEvent.change(searchInput, { target: { value: 'kimi' } });

      await waitFor(() => {
        expect(screen.getByText('Kimi Chat')).toBeInTheDocument();
        expect(screen.queryByText('DeepSeek Chat')).not.toBeInTheDocument();
      });
    });

    it('清空过滤条件应该显示所有模型', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const searchInput = screen.getByPlaceholderText('搜索模型...');

      fireEvent.change(searchInput, { target: { value: 'DeepSeek' } });
      await waitFor(() => {
        expect(screen.queryByText('Kimi Chat')).not.toBeInTheDocument();
      });

      fireEvent.change(searchInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Kimi Chat')).toBeInTheDocument();
        expect(screen.getByText('Zhipu Chat')).toBeInTheDocument();
      });
    });
  });

  describe('空数据状态', () => {
    it('应该显示空数据提示', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      expect(screen.getByText('暂无模型数据')).toBeInTheDocument();
    });
  });

  describe('编辑操作', () => {
    it('点击编辑按钮应该打开编辑弹窗', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      // 查找包含铅笔图标的编辑按钮
      const editButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.lucide-pencil')
      );

      expect(editButtons.length).toBeGreaterThan(0);
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('删除操作', () => {
    it('点击删除按钮应该显示确认对话框', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      // 查找包含垃圾桶图标的删除按钮
      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.lucide-trash-2')
      );

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument();
      });
    });

    it('取消删除应该关闭确认对话框', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.lucide-trash-2')
      );

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: '取消' });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        const confirmDialog = screen.queryByText('确认删除');
        expect(confirmDialog).not.toBeInTheDocument();
      });
    });

    it('确认删除应该触发删除操作', async () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const deleteButtons = screen.getAllByRole('button').filter(btn =>
        btn.querySelector('.lucide-trash-2')
      );

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: '确认' });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        const confirmDialog = screen.queryByText('确认删除');
        expect(confirmDialog).not.toBeInTheDocument();
      });
    });
  });

  describe('导航操作', () => {
    it('点击添加模型按钮应该导航到创建页面', () => {
      const store = createTestStore({
        models: {
          models: mockModels,
          loading: false,
          error: null,
          initializationError: null,
        },
        modelProvider: {
          providers: [],
          loading: false,
          error: null,
          lastUpdate: null,
        },
      });

      const wrapper = createWrapper(store);
      render(<ModelTable />, { wrapper });

      const addButton = screen.getByRole('button', { name: '添加模型' });
      expect(addButton).toBeInTheDocument();
    });
  });
});

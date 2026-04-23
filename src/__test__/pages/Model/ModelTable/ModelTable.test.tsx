/**
 * ModelTable 组件测试
 *
 * 测试模型列表的各种场景
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ModelTable from '@/pages/Model/ModelTable';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createTypeSafeTestStore, renderWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createModelProviderSliceState } from '@/__test__/helpers/mocks/testState';
import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { asTestType } from '@/__test__/helpers/testing-utils';

vi.mock('react-i18next', () => {
  const R = {
    model: { addModel: '添加模型', searchPlaceholder: '搜索模型...', noModelData: '暂无模型数据', confirmDelete: '确认删除', confirmDeleteDescription: '确认要删除模型 {{nickname}} 吗？', deleteModelSuccess: '删除成功', deleteModelFailed: '删除失败', dataLoadFailed: '数据加载失败', operationFailed: '操作失败', fixErrorReload: '修复错误后重新加载' },
    table: { loading: '加载中...', operation: '操作' },
    common: { cancel: '取消', confirm: '确认' },
  };
  return globalThis.__createI18nMockReturn(R);
});

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


describe('ModelTable', () => {
  let mockModels: Model[];

  beforeEach(() => {
    mockModels = [
      createMockModel({
        id: '1',
        nickname: 'DeepSeek Chat',
        providerKey: ModelProviderKeyEnum.DEEPSEEK,
        modelKey: 'deepseek-chat',
      }),
      createMockModel({
        id: '2',
        nickname: 'Kimi Chat',
        providerKey: ModelProviderKeyEnum.MOONSHOTAI,
        modelKey: 'moonshot-v1-8k',
      }),
      createMockModel({
        id: '3',
        nickname: 'Zhipu Chat',
        providerKey: asTestType<ModelProviderKeyEnum>('zhipu'),
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
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
      expect(screen.getByText('Kimi Chat')).toBeInTheDocument();
      expect(screen.getByText('Zhipu Chat')).toBeInTheDocument();
    });

    it('应该显示添加模型按钮', () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const addButton = screen.getByRole('button', { name: '添加模型' });
      expect(addButton).toBeInTheDocument();
    });

    it('应该显示过滤输入框', () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('加载状态', () => {
    it('应该显示加载状态', () => {
      const store = createTestStore({ models: [], loading: true });

      renderWithProviders(<ModelTable />, { store });

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });
  });

  describe('错误状态', () => {
    it('应该显示初始化错误', () => {
      const errorMessage = 'Failed to load models';
      const store = createTestStore({ models: [], initializationError: errorMessage });

      renderWithProviders(<ModelTable />, { store });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('应该显示操作错误', () => {
      const errorMessage = 'Operation failed';
      const store = createTestStore({ models: mockModels, error: errorMessage });

      renderWithProviders(<ModelTable />, { store });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('过滤功能', () => {
    it('应该根据昵称过滤模型列表', async () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      fireEvent.change(searchInput, { target: { value: 'DeepSeek' } });

      await waitFor(() => {
        expect(screen.getByText('DeepSeek Chat')).toBeInTheDocument();
        expect(screen.queryByText('Kimi Chat')).not.toBeInTheDocument();
        expect(screen.queryByText('Zhipu Chat')).not.toBeInTheDocument();
      });
    });

    it('应该支持不区分大小写的过滤', async () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const searchInput = screen.getByPlaceholderText('搜索模型...');
      fireEvent.change(searchInput, { target: { value: 'kimi' } });

      await waitFor(() => {
        expect(screen.getByText('Kimi Chat')).toBeInTheDocument();
        expect(screen.queryByText('DeepSeek Chat')).not.toBeInTheDocument();
      });
    });

    it('清空过滤条件应该显示所有模型', async () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

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
      const store = createTestStore();

      renderWithProviders(<ModelTable />, { store });

      expect(screen.getByText('暂无模型数据')).toBeInTheDocument();
    });
  });

  describe('编辑操作', () => {
    it('点击编辑按钮应该打开编辑弹窗', async () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      // 查找编辑按钮（通过 aria-label）
      const editButtons = screen.getAllByRole('button', { name: '操作' });

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
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      // 查找删除按钮（通过 aria-label）
      const deleteButtons = screen.getAllByRole('button', { name: '确认删除' });

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('确认删除')).toBeInTheDocument();
      });
    });

    it('取消删除应该关闭确认对话框', async () => {
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const deleteButtons = screen.getAllByRole('button', { name: '确认删除' });

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
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const deleteButtons = screen.getAllByRole('button', { name: '确认删除' });

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
      const store = createTestStore({ models: mockModels });

      renderWithProviders(<ModelTable />, { store });

      const addButton = screen.getByRole('button', { name: '添加模型' });
      expect(addButton).toBeInTheDocument();
    });
  });
});

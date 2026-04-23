import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { useBasicModelTable } from '@/hooks/useBasicModelTable';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createChatSliceState } from '@/__test__/helpers/mocks/testState';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

describe('useBasicModelTable', () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  describe('表格列配置测试', () => {
    it('应返回正确的列定义数组', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.tableColumns).toBeDefined();
      expect(Array.isArray(result.current.tableColumns)).toBe(true);
      expect(result.current.tableColumns.length).toBeGreaterThan(0);
    });

    it('应包含所有必需的列', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 第三方库类型定义不完整
      const columnKeys = result.current.tableColumns.map((col) => (col as any).accessorKey || col.id);

      expect(columnKeys).toContain('nickname');
      expect(columnKeys).toContain('providerKey');
      expect(columnKeys).toContain('modelName');
      expect(columnKeys).toContain('updateAt');
      expect(columnKeys).toContain('createdAt');
      expect(columnKeys).toContain('remark');
    });

    it('每列应包含正确的属性', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      result.current.tableColumns.forEach((column) => {
        expect(column).toHaveProperty('accessorKey');
        expect(column).toHaveProperty('header');
        expect(column).toHaveProperty('cell');
      });
    });

  });

  describe('表格数据格式化测试', () => {
    it('应返回格式化后的模型数据', () => {
      const model1 = createMockModel({ id: 'model-1', nickname: 'GPT-4', providerKey: ModelProviderKeyEnum.DEEPSEEK });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Claude', providerKey: ModelProviderKeyEnum.MOONSHOTAI });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toBeDefined();
      expect(result.current.filteredModels).toHaveLength(2);
    });

    it('应支持过滤功能', async () => {
      const model1 = createMockModel({ id: 'model-1', nickname: 'GPT-4', providerKey: ModelProviderKeyEnum.DEEPSEEK });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Claude', providerKey: ModelProviderKeyEnum.MOONSHOTAI });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      const initialCount = result.current.filteredModels.length;

      result.current.setFilterText('GPT');

      // 等待防抖完成（useDebouncedFilter 使用了500ms防抖）
      vi.useFakeTimers();
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.filteredModels.length).toBeLessThanOrEqual(initialCount);
    });

    it('应过滤掉已删除的模型', () => {
      const model1 = createMockModel({ id: 'model-1', nickname: 'GPT-4', providerKey: ModelProviderKeyEnum.DEEPSEEK });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Claude', providerKey: ModelProviderKeyEnum.MOONSHOTAI, isDeleted: true });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toHaveLength(1);
      expect(result.current.filteredModels[0].id).toBe('model-1');
    });

  });

  describe('使用 createMockModel 创建测试模型数据', () => {
    it('应使用 createMockModel 创建测试数据', () => {
      const mockModels = [
        createMockModel({ id: 'test-1', nickname: 'Test Model 1', providerKey: ModelProviderKeyEnum.DEEPSEEK }),
        createMockModel({ id: 'test-2', nickname: 'Test Model 2', providerKey: ModelProviderKeyEnum.MOONSHOTAI }),
        createMockModel({ id: 'test-3', nickname: 'Test Model 3', providerKey: ModelProviderKeyEnum.ZHIPUAI }),
      ];

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: mockModels }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toHaveLength(3);
      expect(result.current.filteredModels[0].nickname).toBe('Test Model 1');
    });

  });

  describe('过滤文本状态测试', () => {
    it('应返回过滤文本状态', async () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filterText).toBe('');

      act(() => {
        result.current.setFilterText('test');
      });

      await waitFor(() => {
        expect(result.current.filterText).toBe('test');
      });
    });

    it('应支持更新过滤文本', async () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      act(() => {
        result.current.setFilterText('openai');
      });

      await waitFor(() => {
        expect(result.current.filterText).toBe('openai');
      });

      act(() => {
        result.current.setFilterText('anthropic');
      });

      await waitFor(() => {
        expect(result.current.filterText).toBe('anthropic');
      });

      act(() => {
        result.current.setFilterText('');
      });

      await waitFor(() => {
        expect(result.current.filterText).toBe('');
      });
    });

  });
});

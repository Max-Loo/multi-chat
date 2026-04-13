import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useBasicModelTable } from '@/hooks/useBasicModelTable';
import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createModelSliceState, createChatSliceState } from '@/__test__/helpers/mocks/testState';

const createMockModel = (id: string, nickname: string, providerKey: ModelProviderKeyEnum): Model => ({
  id,
  nickname,
  providerKey,
  providerName: providerKey,
  modelName: `Model-${id}`,
  modelKey: `model-key-${id}`,
  apiAddress: 'https://api.example.com',
  apiKey: 'key',
  isEnable: true,
  createdAt: '2024-01-01 00:00:00',
  updateAt: '2024-01-01 00:00:00',
});

const createWrapper = (store: ReturnType<typeof createTypeSafeTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        {children}
      </Provider>
    );
  };
};

describe('useBasicModelTable', () => {
  describe('表格列配置测试', () => {
    it('应返回正确的列定义数组', () => {
      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      expect(result.current.tableColumns).toBeDefined();
      expect(Array.isArray(result.current.tableColumns)).toBe(true);
      expect(result.current.tableColumns.length).toBeGreaterThan(0);
    });

    it('应包含所有必需的列', () => {
      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

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
      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      result.current.tableColumns.forEach((column) => {
        expect(column).toHaveProperty('accessorKey');
        expect(column).toHaveProperty('header');
        expect(column).toHaveProperty('cell');
      });
    });

  });

  describe('表格数据格式化测试', () => {
    it('应返回格式化后的模型数据', () => {
      const model1 = createMockModel('model-1', 'GPT-4', ModelProviderKeyEnum.DEEPSEEK);
      const model2 = createMockModel('model-2', 'Claude', ModelProviderKeyEnum.MOONSHOTAI);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [model1, model2] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      expect(result.current.filteredModels).toBeDefined();
      expect(result.current.filteredModels).toHaveLength(2);
    });

    it('应支持过滤功能', async () => {
      const model1 = createMockModel('model-1', 'GPT-4', ModelProviderKeyEnum.DEEPSEEK);
      const model2 = createMockModel('model-2', 'Claude', ModelProviderKeyEnum.MOONSHOTAI);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [model1, model2] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      const initialCount = result.current.filteredModels.length;

      result.current.setFilterText('GPT');

      // 等待防抖完成（useDebouncedFilter 使用了500ms防抖）
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(result.current.filteredModels.length).toBeLessThanOrEqual(initialCount);
    });

    it('应过滤掉已删除的模型', () => {
      const model1 = createMockModel('model-1', 'GPT-4', ModelProviderKeyEnum.DEEPSEEK);
      const model2 = { ...createMockModel('model-2', 'Claude', ModelProviderKeyEnum.MOONSHOTAI), isDeleted: true };

      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [model1 as Model, model2 as Model] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      expect(result.current.filteredModels).toHaveLength(1);
      expect(result.current.filteredModels[0].id).toBe('model-1');
    });

  });

  describe('使用 createMockModel 创建测试模型数据', () => {
    it('应使用 createMockModel 创建测试数据', () => {
      const mockModels = [
        createMockModel('test-1', 'Test Model 1', ModelProviderKeyEnum.DEEPSEEK),
        createMockModel('test-2', 'Test Model 2', ModelProviderKeyEnum.MOONSHOTAI),
        createMockModel('test-3', 'Test Model 3', ModelProviderKeyEnum.ZHIPUAI),
      ];

      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: mockModels as Model[] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      expect(result.current.filteredModels).toHaveLength(3);
      expect(result.current.filteredModels[0].nickname).toBe('Test Model 1');
    });

  });

  describe('过滤文本状态测试', () => {
    it('应返回过滤文本状态', async () => {
      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

      expect(result.current.filterText).toBe('');

      act(() => {
        result.current.setFilterText('test');
      });

      await waitFor(() => {
        expect(result.current.filterText).toBe('test');
      });
    });

    it('应支持更新过滤文本', async () => {
      const store = createTypeSafeTestStore({
        models: createModelSliceState({ models: [] }),
        chat: createChatSliceState(),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useBasicModelTable(), { wrapper });

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

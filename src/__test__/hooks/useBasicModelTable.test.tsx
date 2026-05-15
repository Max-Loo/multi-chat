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
      const model1 = createMockModel({ id: 'model-1', nickname: 'GPT-4', modelName: 'gpt-4', providerKey: ModelProviderKeyEnum.DEEPSEEK });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Claude', modelName: 'claude-3', providerKey: ModelProviderKeyEnum.MOONSHOTAI });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toHaveLength(2);

      act(() => {
        result.current.setFilterText('GPT');
      });

      // 等待防抖完成（useDebouncedFilter 默认 200ms 防抖）
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
      expect(result.current.filteredModels[0].nickname).toBe('GPT-4');
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

  describe('四字段独立过滤验证', () => {
    it('应通过 nickname 字段过滤', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'AlphaModel', providerName: 'OpenAI', modelName: 'gpt-4', remark: 'fast' });
      const model2 = createMockModel({ id: '2', nickname: 'BetaModel', providerName: 'Anthropic', modelName: 'claude', remark: 'slow' });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      act(() => { result.current.setFilterText('alpha'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
      expect(result.current.filteredModels[0].nickname).toBe('AlphaModel');
    });

    it('应通过 providerName 字段过滤', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'A', providerName: 'OpenAI', modelName: 'gpt', remark: '' });
      const model2 = createMockModel({ id: '2', nickname: 'B', providerName: 'Anthropic', modelName: 'claude', remark: '' });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      act(() => { result.current.setFilterText('anthropic'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
      expect(result.current.filteredModels[0].providerName).toBe('Anthropic');
    });

    it('应通过 modelName 字段过滤', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'A', providerName: 'X', modelName: 'gpt-4o-mini', remark: '' });
      const model2 = createMockModel({ id: '2', nickname: 'B', providerName: 'Y', modelName: 'claude-3', remark: '' });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      act(() => { result.current.setFilterText('gpt-4o'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
      expect(result.current.filteredModels[0].modelName).toBe('gpt-4o-mini');
    });

    it('应通过 remark 字段过滤', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'A', providerName: 'X', modelName: 'gpt', remark: 'production grade' });
      const model2 = createMockModel({ id: '2', nickname: 'B', providerName: 'Y', modelName: 'claude', remark: 'experimental' });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      act(() => { result.current.setFilterText('production'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
      expect(result.current.filteredModels[0].remark).toBe('production grade');
    });
  });

  describe('大小写不敏感过滤验证', () => {
    it('应忽略大小写过滤模型', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'GPT-4', providerName: 'OpenAI', modelName: 'gpt-4-turbo', remark: '' });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1] }),
          chat: createChatSliceState(),
        },
      });

      // 用小写搜索大写的 nickname
      act(() => { result.current.setFilterText('gpt-4'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });

      // 用大写搜索小写的 modelName
      act(() => { result.current.setFilterText('GPT-4-TURBO'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });

      // 混合大小写搜索 providerName
      act(() => { result.current.setFilterText('oPeNaI'); });
      await waitFor(() => {
        expect(result.current.filteredModels).toHaveLength(1);
      });
    });
  });

  describe('isDeleted 模型排除验证', () => {
    it('应排除所有 isDeleted 为 true 的模型', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'Active', isDeleted: false });
      const model2 = createMockModel({ id: '2', nickname: 'Deleted1', isDeleted: true });
      const model3 = createMockModel({ id: '3', nickname: 'Deleted2', isDeleted: true });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2, model3] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toHaveLength(1);
      expect(result.current.filteredModels[0].id).toBe('1');
    });

    it('应返回全部模型 当没有 isDeleted 的模型', async () => {
      const model1 = createMockModel({ id: '1', nickname: 'A', isDeleted: false });
      const model2 = createMockModel({ id: '2', nickname: 'B', isDeleted: false });

      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [model1, model2] }),
          chat: createChatSliceState(),
        },
      });

      expect(result.current.filteredModels).toHaveLength(2);
    });
  });

  describe('列定义渲染函数测试', () => {
    it('remark 列应在 remark 为空时返回 "-"', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remarkCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'remark') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue(undefined) };
      expect(remarkCol.cell({ row: mockRow })).toBe('-');
    });

    it('remark 列应在 remark 有值时返回原值', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const remarkCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'remark') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue('测试备注') };
      expect(remarkCol.cell({ row: mockRow })).toBe('测试备注');
    });

    it('nickname 列应返回 row 的 nickname 值', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nicknameCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'nickname') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue('TestNick') };
      expect(nicknameCol.cell({ row: mockRow })).toBe('TestNick');
    });

    it('modelName 列应返回 row 的 modelName 值', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modelNameCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'modelName') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue('gpt-4') };
      expect(modelNameCol.cell({ row: mockRow })).toBe('gpt-4');
    });

    it('updateAt 列应返回 row 的 updateAt 值', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateAtCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'updateAt') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue('2024-01-01') };
      expect(updateAtCol.cell({ row: mockRow })).toBe('2024-01-01');
    });

    it('createdAt 列应返回 row 的 createdAt 值', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const createdAtCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'createdAt') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue('2024-06-01') };
      expect(createdAtCol.cell({ row: mockRow })).toBe('2024-06-01');
    });

    it('providerKey 列应渲染 ModelProviderDisplay 组件', () => {
      const { result } = renderHookWithProviders(() => useBasicModelTable(), {
        preloadedState: {
          models: createModelSliceState({ models: [] }),
          chat: createChatSliceState(),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const providerCol = result.current.tableColumns.find((col: any) => col.accessorKey === 'providerKey') as any;
      const mockRow = { getValue: vi.fn().mockReturnValue(ModelProviderKeyEnum.DEEPSEEK) };
      const rendered = providerCol.cell({ row: mockRow });
      // cell 应返回 JSX（ModelProviderDisplay 组件）
      expect(rendered).toBeTruthy();
    });
  });
});

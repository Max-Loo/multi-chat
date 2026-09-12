import { computed, h, ref } from 'vue';
import type { CellContext, ColumnDef, TableFeatures } from '@tanstack/vue-table';
import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay.vue';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useModelStore } from '@/store/pinia/model';
import { useTranslation } from '@/composables/useTranslation';
import type { Model } from '@/types/model';

/**
 * 基础的模型列表相关逻辑（Vue 版 useBasicModelTable）
 * 提供表格列定义、数据过滤等功能，供 ModelSelect 与 Model 页表格复用
 */
export const useBasicModelTable = () => {
  const modelStore = useModelStore();
  const { t } = useTranslation();

  // 不包含已删除模型的模型列表
  const models = computed(() => modelStore.models.filter((model) => !model.isDeleted));

  // 本地状态：过滤文本
  const filterText = ref<string>('');
  const setFilterText = (value: string) => {
    filterText.value = value;
  };

  const {
    filteredList: filteredModels,
  } = useDebouncedFilter<Model>(
    filterText,
    models,
    (model) => {
      const {
        nickname,
        providerName,
        modelName,
        remark = '',
      } = model;

      // 会影响筛选的字段
      return [
        nickname,
        providerName,
        modelName,
        remark,
      ].map((item) => item.toLocaleLowerCase() || '').some((item) => item.includes(filterText.value.toLocaleLowerCase()));
    },
  );

  /**
   * 表格列定义
   * 使用 @tanstack/vue-table 的 ColumnDef 类型
   */
  const tableColumns = computed<ColumnDef<TableFeatures, Model>[]>(() => [
    {
      accessorKey: 'nickname',
      header: t(($) => $.table.nickname),
      cell: ({ row }: CellContext<TableFeatures, Model>) => row.getValue('nickname'),
    },
    {
      accessorKey: 'providerKey',
      header: t(($) => $.table.modelProvider),
      cell: ({ row }: CellContext<TableFeatures, Model>) =>
        h(ModelProviderDisplay, { providerKey: row.getValue('providerKey') }),
    },
    {
      accessorKey: 'modelName',
      header: t(($) => $.table.modelName),
      cell: ({ row }: CellContext<TableFeatures, Model>) => row.getValue('modelName'),
    },
    {
      accessorKey: 'updateAt',
      header: t(($) => $.table.lastUpdateTime),
      cell: ({ row }: CellContext<TableFeatures, Model>) => row.getValue('updateAt'),
    },
    {
      accessorKey: 'createdAt',
      header: t(($) => $.table.createTime),
      cell: ({ row }: CellContext<TableFeatures, Model>) => row.getValue('createdAt'),
    },
    {
      accessorKey: 'remark',
      header: t(($) => $.common.remark),
      cell: ({ row }: CellContext<TableFeatures, Model>) => {
        const remark = row.getValue('remark') as string | undefined;
        return remark || '-';
      },
    },
  ]);

  return {
    tableColumns,
    filterText,
    setFilterText,
    filteredModels,
  };
};

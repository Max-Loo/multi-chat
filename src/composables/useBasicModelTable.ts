/**
 * 基础的模型列表相关逻辑（对应旧版 hooks/useBasicModelTable.tsx）
 *
 * 提供表格列定义、数据过滤等功能。
 * 列的 cell 渲染在 Vue 版中返回 VNode（h() 渲染函数）。
 */
import { computed, h, ref, type ComputedRef, type Ref } from 'vue';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import type { ColumnDef } from '@tanstack/vue-table';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { useExistingModels } from '@/composables/useExistingModels';
import { useTranslation } from '@/composables/useTranslation';
import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay.vue';
import type { Model } from '@/types/model';

/**
 * 基础模型表格逻辑
 */
export const useBasicModelTable = (): {
  tableColumns: ComputedRef<ColumnDef<Model, unknown>[]>;
  filterText: Ref<string>;
  setFilterText: (value: string) => void;
  filteredModels: ComputedRef<Model[]>;
} => {
  const models = useExistingModels();
  const { t } = useTranslation();

  // 本地状态：过滤文本
  const filterText = ref('');

  const { filteredList: filteredModels } = useDebouncedFilter<Model>(
    () => filterText.value,
    () => models.value,
    (model) => {
      const { nickname, providerName, modelName, remark = '' } = model;

      // 会影响筛选的字段
      return [
        nickname,
        providerName,
        modelName,
        remark,
      ]
        .map((item) => item.toLocaleLowerCase() || '')
        .some((item) => item.includes(filterText.value.toLocaleLowerCase()));
    },
  );

  /**
   * 表格列定义
   * 使用 @tanstack/vue-table 的 ColumnDef 类型
   */
  const tableColumns = computed<ColumnDef<Model, unknown>[]>(() => [
    {
      accessorKey: 'nickname',
      header: t('table.nickname'),
      cell: ({ row }) => row.getValue('nickname'),
    },
    {
      accessorKey: 'providerKey',
      header: t('table.modelProvider'),
      cell: ({ row }) => {
        const providerKey = row.getValue(
          'providerKey',
        ) as ModelProviderKeyEnum;
        return h(ModelProviderDisplay, { providerKey });
      },
    },
    {
      accessorKey: 'modelName',
      header: t('table.modelName'),
      cell: ({ row }) => row.getValue('modelName'),
    },
    {
      accessorKey: 'updateAt',
      header: t('table.lastUpdateTime'),
      cell: ({ row }) => row.getValue('updateAt'),
    },
    {
      accessorKey: 'createdAt',
      header: t('table.createTime'),
      cell: ({ row }) => row.getValue('createdAt'),
    },
    {
      accessorKey: 'remark',
      header: t('common.remark'),
      cell: ({ row }) => {
        const remark = row.getValue('remark') as string | undefined;
        return remark || '-';
      },
    },
  ]);

  return {
    tableColumns,
    filterText,
    setFilterText: (value: string) => {
      filterText.value = value;
    },
    filteredModels,
  };
};

/**
 * 基础模型表格组合式函数（转写自 React hooks/useBasicModelTable）
 *
 * 提供表格列定义与防抖过滤
 */
import { computed, h, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import type { ColumnDef } from '@tanstack/vue-table';
import { useDebouncedFilter } from '@/composables/useDebouncedFilter';
import { useExistingModels } from '@/composables/useExistingModels';
import ModelProviderDisplay from '@/pages/Model/ModelTable/components/ModelProviderDisplay/index.vue';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

/**
 * 基础的模型列表相关逻辑
 */
export function useBasicModelTable() {
  const models = useExistingModels();
  const { t } = useTranslation();

  // 本地状态：过滤文本
  const filterText = ref('');

  const { filteredList: filteredModels } = useDebouncedFilter<Model>(
    filterText,
    computed(() => models.value),
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
   * 表格列定义（@tanstack/vue-table 的 ColumnDef）
   */
  const tableColumns = computed<ColumnDef<Model>[]>(() => [
    {
      accessorKey: 'nickname',
      header: () => t('table.nickname'),
      cell: ({ row }) => row.getValue('nickname'),
    },
    {
      accessorKey: 'providerKey',
      header: () => t('table.modelProvider'),
      cell: ({ row }) =>
        h(ModelProviderDisplay, {
          providerKey: row.getValue('providerKey') as ModelProviderKeyEnum,
        }),
    },
    {
      accessorKey: 'modelName',
      header: () => t('table.modelName'),
      cell: ({ row }) => row.getValue('modelName'),
    },
    {
      accessorKey: 'updateAt',
      header: () => t('table.lastUpdateTime'),
      cell: ({ row }) => row.getValue('updateAt'),
    },
    {
      accessorKey: 'createdAt',
      header: () => t('table.createTime'),
      cell: ({ row }) => row.getValue('createdAt'),
    },
    {
      accessorKey: 'remark',
      header: () => t('common.remark'),
      cell: ({ row }) => (row.getValue('remark') as string | undefined) || '-',
    },
  ]);

  return {
    tableColumns,
    filterText,
    filteredModels,
  };
}

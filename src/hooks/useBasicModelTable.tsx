import ModelProviderDisplay from "@/pages/Model/ModelTable/components/ModelProviderDisplay"
import { Model } from "@/types/model"
import { useMemo, useState } from "react";
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter";
import { ColumnDef } from "@tanstack/react-table";
import { ModelProviderKeyEnum } from "@/utils/enums";
import { useExistingModels } from "./useExistingModels";
import { useTranslation } from "react-i18next";

/**
 * @description 基础的模型列表相关逻辑
 * 提供表格列定义、数据过滤等功能
 */
export const useBasicModelTable = () => {
  const models = useExistingModels()
  const { t } = useTranslation()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('');
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
      } = model

      // 会影响筛选的字段
      return [
        nickname,
        providerName,
        modelName,
        remark,
      ].map(item => item.toLocaleLowerCase() || '').some(item => item.includes(filterText.toLocaleLowerCase()))
    },
  )

  /**
   * 表格列定义
   * 使用 @tanstack/react-table 的 ColumnDef 类型
   */
  const tableColumns: ColumnDef<Model>[] = useMemo(() => [
    {
      accessorKey: 'nickname',
      header: t($ => $.table.nickname),
      cell: ({ row }) => row.getValue('nickname'),
    },
    {
      accessorKey: 'providerKey',
      header: t($ => $.table.modelProvider),
      cell: ({ row }) => {
        const providerKey = row.getValue('providerKey') as ModelProviderKeyEnum;
        return <ModelProviderDisplay providerKey={providerKey} />;
      },
    },
    {
      accessorKey: 'modelName',
      header: t($ => $.table.modelName),
      cell: ({ row }) => row.getValue('modelName'),
    },
    {
      accessorKey: 'updateAt',
      header: t($ => $.table.lastUpdateTime),
      cell: ({ row }) => row.getValue('updateAt'),
    },
    {
      accessorKey: 'createdAt',
      header: t($ => $.table.createTime),
      cell: ({ row }) => row.getValue('createdAt'),
    },
    {
      accessorKey: 'remark',
      header: t($ => $.common.remark),
      cell: ({ row }) => {
        const remark = row.getValue('remark') as string | undefined;
        return remark || '-';
      },
    },
  ], [t])

  return {
    tableColumns,
    filterText,
    setFilterText,
    filteredModels,
  }
}
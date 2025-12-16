import ModelProviderDisplay from "@/pages/Model/ModelTable/components/ModelProviderDisplay"
import { Model } from "@/types/model"
import { useMemo, useState } from "react";
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter";
import { TableColumnsType } from "antd";
import { ModelProviderKeyEnum } from "@/utils/enums";
import { useExistingModels } from "./useExistingModels";
import { useTranslation } from "react-i18next";

/**
 * @description 基础的模型列表相关逻辑
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

  const tableColumns: TableColumnsType<Model> = useMemo(() => [
    {
      title: t($ => $.table.nickname),
      dataIndex: 'nickname',
      key: 'nickname',
      sorter: (a, b) => a.nickname?.localeCompare(b.nickname),
    },
    {
      title: t($ => $.table.modelProvider),
      dataIndex: 'providerKey',
      key: 'providerKey',
      render: (providerKey: ModelProviderKeyEnum) => <ModelProviderDisplay providerKey={providerKey} />,
    },
    {
      title: t($ => $.table.modelName),
      dataIndex: 'modelName',
      key: 'modelName',
      sorter: (a, b) => a.modelName?.localeCompare(b.modelName),
    },
    {
      title: t($ => $.table.lastUpdateTime),
      dataIndex: 'updateAt',
      key: 'updateAt',
      sorter: (a, b) => a.updateAt?.localeCompare(b.updateAt),
    },
    {
      title: t($ => $.table.createTime),
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => a.createdAt?.localeCompare(b.createdAt),
    },
    {
      title: t($ => $.common.remark),
      dataIndex: 'remark',
      key: 'remark',
      render: (remark?: string) => remark || '-',
    },

  ], [t])

  return {
    tableColumns,
    filterText,
    setFilterText,
    filteredModels,
  }
}
import ModelProviderDisplay from "@/pages/Model/ModelTable/components/ModelProviderDisplay"
import { Model } from "@/types/model"
import { useState } from "react";
import { useDebouncedFilter } from "@/components/FilterInput/hooks/useDebouncedFilter";
import { TableColumnsType } from "antd";
import { ModelProviderKeyEnum } from "@/utils/enums";
import { useExistingModels } from "./useExistingModels";

/**
 * @description 基础的模型列表相关逻辑
 */
export const useBasicModelTable = () => {
  const models = useExistingModels()

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

  const tableColumns: TableColumnsType<Model> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      sorter: (a, b) => a.nickname?.localeCompare(b.nickname),
    },
    {
      title: '大模型服务商',
      dataIndex: 'providerKey',
      key: 'providerKey',
      render: (providerKey: ModelProviderKeyEnum) => <ModelProviderDisplay providerKey={providerKey} />,
    },
    {
      title: '模型名称',
      dataIndex: 'modelName',
      key: 'modelName',
      sorter: (a, b) => a.modelName?.localeCompare(b.modelName),
    },
    {
      title: '最近更新时间',
      dataIndex: 'updateAt',
      key: 'updateAt',
      sorter: (a, b) => a.updateAt?.localeCompare(b.updateAt),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => a.createdAt?.localeCompare(b.createdAt),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark?: string) => remark || '-',
    },

  ]

  return {
    tableColumns,
    filterText,
    setFilterText,
    filteredModels,
  }
}
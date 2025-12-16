import React, { useCallback, useState } from 'react';
import { Table, Button, Space, Alert, Popconfirm, TableColumnsType, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { deleteModel } from '@/store/slices/modelSlice';
import type { Model } from '@/types/model';
import { useNavToPage } from '@/store/slices/modelPageSlice';
import FilterInput from '@/components/FilterInput';
import EditModelModal from './components/EditModelModal';
import { useBasicModelTable } from '@/hooks/useBasicModelTable';
import { useTranslation } from 'react-i18next';

// 模型表格主组件
const ModelTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.models.loading);
  const error = useAppSelector((state) => state.models.error);
  const initializationError = useAppSelector((state) => state.models.initializationError);
  const { t } = useTranslation()

  const {
    message,
  } = App.useApp()

  const { navToAddPage } = useNavToPage()

  // 处理删除模型
  const handleDeleteModel = useCallback((model: Model): void => {
    try {
      dispatch(deleteModel({ model }));
      message.success(t($ => $.model.deleteModelSuccess));
    } catch {
      message.error(t($ => $.model.deleteModelFailed));
    }
  }, [dispatch, message, t]);

  // 处理添加模型按钮点击
  const handleAddModel = () => {
    // 跳转到添加模型页面
    navToAddPage()
  };

  // 当前点击需要编辑的模型
  const [currentEditingModel, setCurrentEditingModel] = useState<Model>()
  // 控制编辑模型弹窗的开关
  const [isModalOpen, setIsModalOpen] = useState(false)
  // 处理点击编辑模型按钮
  const handleEditModel = useCallback((value: Model) => {
    setCurrentEditingModel(value)
    setIsModalOpen(true)
  }, [setCurrentEditingModel, setIsModalOpen])

  // 关闭编辑模型弹窗的回调
  const onModalCancel = () => {
    setIsModalOpen(false)
  }

  // 一些基础的和模型列表相关的封装逻辑
  const {
    tableColumns,
    filterText,
    filteredModels,
    setFilterText,
  } = useBasicModelTable()

  // 表格列定义
  const columns = React.useMemo<TableColumnsType<Model>>(() => [
    ...tableColumns,
    {
      title: t($ => $.table.operation),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditModel(record)}
          />
          <Popconfirm
            title={t($ => $.model.confirmDelete)}
            description={t($ => $.model.confirmDeleteDescription, { nickname: record.nickname })}
            onConfirm={() => handleDeleteModel(record)}
            okText={t($ => $.common.confirm)}
            cancelText={t($ => $.common.cancel)}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              size="small"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleEditModel, handleDeleteModel, tableColumns, t])

  return (
    <div className="p-6">
      {/* 显示初始化错误 */}
      {initializationError && (
        <Alert
          title={t($ => $.model.dataLoadFailed)}
          description={initializationError}
          type="error"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* 显示操作错误 */}
      {error && (
        <Alert
          title={t($ => $.model.operationFailed)}
          description={error}
          type="error"
          showIcon
          closable
          className="mb-4"
        />
      )}

      {/* 表格头部：添加按钮和过滤器 */}
      <div className="flex items-center justify-between mt-2 mb-4">
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddModel}
          >
            {t($ => $.model.addModel)}
          </Button>
        </Space>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          className='w-72!'
          placeholder={t($ => $.model.searchPlaceholder)}
        />
      </div>

      {/* 模型数据表格 */}
      <Table
        columns={columns}
        dataSource={filteredModels}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: initializationError
            ? t($ => $.model.fixErrorReload)
            : t($ => $.model.noModelData),
        }}
      />
      <EditModelModal
        modelProviderKey={currentEditingModel?.providerKey}
        modelParams={currentEditingModel}
        isModalOpen={isModalOpen}
        onModalCancel={onModalCancel}
      />
    </div>
  );
};

export default ModelTable;
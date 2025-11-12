import React, { useState } from 'react';
import { Table, Button, Space, Alert, Popconfirm, TableColumnsType, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { deleteModel } from '@/store/slices/modelSlice';
import type { Model } from '@/types/model';
import { useNavToPage } from '@/store/slices/modelPageSlice';
import FilterInput from '@/components/FilterInput';
import EditModelModal from './components/EditModelModal';
import { useBasicModelTable } from '@/hooks/useBasicModelTable';

// 模型表格主组件
const ModelTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.models.loading);
  const error = useAppSelector((state) => state.models.error);
  const initializationError = useAppSelector((state) => state.models.initializationError);

  const {
    message,
  } = App.useApp()

  const { navToAddPage } = useNavToPage()

  // 处理删除模型
  const handleDeleteModel = (model: Model): void => {
    try {
      dispatch(deleteModel({ model }));
      message.success('模型删除成功');
    } catch {
      message.error('模型删除失败');
    }
  };

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
  const handleEditModel = (value: Model) => {
    setCurrentEditingModel(value)
    setIsModalOpen(true)
  }
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
  const columns: TableColumnsType<Model> = [
    ...tableColumns,
    {
      title: '操作',
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
            title="确认删除"
            description={`确定要删除模型 "${record.nickname}" 吗？`}
            onConfirm={() => handleDeleteModel(record)}
            okText="确定"
            cancelText="取消"
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
  ]

  return (
    <div className="p-6">
      {/* 显示初始化错误 */}
      {initializationError && (
        <Alert
          message="数据加载失败"
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
          message="操作失败"
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
            添加模型
          </Button>
        </Space>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
          className='w-72!'
          placeholder='搜索昵称或备注'
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
            ? '请修复错误后重新加载数据'
            : '暂无模型数据，点击"添加模型"创建第一个模型',
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
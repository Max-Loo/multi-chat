import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Alert, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Store } from '@tauri-apps/plugin-store';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { initializeModels, deleteModel } from '@/store/slices/modelSlice';
import { generateMockModels } from '@/utils/mockData';
import ModelProviderDisplay from './components/ModelProviderDisplay';
import type { ColumnsType } from 'antd/es/table';
import type { Model } from '@/types/model';
import { debounce } from 'es-toolkit';
import { useNavToPage } from '@/store/slices/modelPageSlice';
import FilterInput from '@/components/FilterInput';

// 模型表格主组件
const ModelTable: React.FC = () => {
  const dispatch = useAppDispatch();
  const { models, loading, error, initializationError } = useAppSelector(
    (state) => state.models,
  );

  const { navToAddPage } = useNavToPage()

  // 本地状态：过滤文本
  const [filterText, setFilterText] = useState<string>('');
  // 本地状态：过滤后的模型列表列表
  const [filteredModels, setFilteredModels] = useState<Model[]>(models)
  useEffect(() => {
    const debouncedSetFilterModels = debounce((text: string) => {
    if (!text) {
      setFilteredModels(models)
    } else {
      setFilteredModels(models.filter(model => {
        return model.nickname.toLowerCase().includes(filterText.toLowerCase()) ||
          (model.remark?.toLowerCase().includes(filterText.toLowerCase()) ?? false)
        },
      ))
    }
  }, 300)


    debouncedSetFilterModels(filterText)
    // 取消防抖函数
    return () => {
      debouncedSetFilterModels.cancel()
    }
  }, [filterText, models])



  // 处理删除模型
  const handleDeleteModel = async (modelId: string) => {
    try {
      await dispatch(deleteModel({ modelId, models })).unwrap();
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

  // 加载mock数据（仅用于开发测试）
  const handleLoadMockData = async () => {
    try {
      const store = await Store.load('model.json', {
        autoSave: false,
        defaults: {},
      });
      const mockData = generateMockModels();
      await store.set('models', mockData);
      await store.save();
      dispatch(initializeModels());
      message.success('Mock数据加载成功');
    } catch {
      message.error('Mock数据加载失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<Model> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      sorter: (a, b) => a.nickname.localeCompare(b.nickname),
    },
    {
      title: '大模型服务商',
      dataIndex: 'provider',
      key: 'provider',
      render: (provider: string) => <ModelProviderDisplay providerKey={provider} />,
    },
    {
      title: '模型名称',
      dataIndex: 'modelName',
      key: 'modelName',
      sorter: (a, b) => a.modelName.localeCompare(b.modelName),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark?: string) => remark || '-',
    },
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
            disabled
          />
          <Popconfirm
            title="确认删除"
            description={`确定要删除模型 "${record.nickname}" 吗？`}
            onConfirm={() => handleDeleteModel(record.id)}
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
  ];

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
          {/* 开发环境下的mock数据按钮 */}
          {import.meta.env.DEV && (
            <Button
              type="default"
              onClick={handleLoadMockData}
            >
              加载Mock数据
            </Button>
          )}
        </Space>
        <FilterInput
          value={filterText}
          onChange={setFilterText}
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
    </div>
  );
};

export default ModelTable;
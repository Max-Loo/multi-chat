import React, { useState } from 'react';
import ModelSidebar from './components/ModelSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import ModelConfigForm from '../components/ModelConfigForm';
import { Model } from '@/types/model';
import { useNavToPage } from '@/store/slices/modelPageSlice';
import { useAppDispatch } from '@/hooks/redux';
import { createModel } from '@/store/slices/modelSlice';
import { App } from 'antd';

// 添加模型页面
const CreateModel: React.FC = () => {
  const [
    selectedModelProviderKey,
    setSelectedModelProviderKey,
  ] = useState(ModelProviderKeyEnum.DEEPSEEK)

  const {
    message,
  } = App.useApp()

  const dispatch = useAppDispatch()

  const { navToTablePage } = useNavToPage()

  // 表单校验完成后的回调
  const onFormFinish = (model: Model): void => {
    try {
      dispatch(createModel({
        model,
      }))

      message.success('模型添加成功')
      // 返回到列表页面
      navToTablePage()
    } catch {
      message.error('模型添加失败')
    }
  }

  return (
    <div className="flex items-start justify-start h-full">
      <div className="h-full border-r border-gray-200">
        <ModelSidebar
          value={selectedModelProviderKey}
          onChange={setSelectedModelProviderKey}
        />
      </div>
      <div className="w-full h-full p-4">
        <ModelConfigForm
          modelProviderKey={selectedModelProviderKey}
          onFinish={onFormFinish}
        />
      </div>
    </div>
  );
};

export default CreateModel;
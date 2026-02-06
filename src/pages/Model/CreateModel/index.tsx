import React, { useState } from 'react';
import ModelSidebar from './components/ModelSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import ModelConfigForm from '../components/ModelConfigForm';
import { Model } from '@/types/model';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { createModel } from '@/store/slices/modelSlice';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// 添加模型页面
const CreateModel: React.FC = () => {
  const { t } = useTranslation()

  const [
    selectedModelProviderKey,
    setSelectedModelProviderKey,
  ] = useState(ModelProviderKeyEnum.DEEPSEEK)

  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // 表单校验完成后的回调
  const onFormFinish = (model: Model): void => {
    try {
      dispatch(createModel({
        model,
      }))

      toast.success(t($ => $.model.addModelSuccess))
      // 返回到列表页面
      navigate('/model/table')
    } catch {
      toast.error(t($ => $.model.addModelFailed))
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
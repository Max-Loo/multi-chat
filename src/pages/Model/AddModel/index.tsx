import React, { useState } from 'react';
import ModelSidebar from './components/ModelSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import ModelConfigForm from '../components/ModelConfigForm';

// 添加模型页面
const AddModel: React.FC = () => {
  const [
    selectedModelProviderKey,
    setSelectedModelProviderKey,
  ] = useState(ModelProviderKeyEnum.DEEPSEEK)

  return (
    <div className="flex items-start justify-start h-full">
      <div className="h-full p-2 border-r border-gray-200">
        <ModelSidebar value={selectedModelProviderKey} onChange={setSelectedModelProviderKey} />
      </div>
      <div className="w-full h-full p-4">
        <ModelConfigForm modelProviderKey={selectedModelProviderKey} />
      </div>
    </div>
  );
};

export default AddModel;
import React, { useState } from 'react';
import ModelSidebar from './components/ModelSidebar';
import { ModelProviderKeyEnum } from '@/utils/enums';

// 添加模型页面
const AddModel: React.FC = () => {
  const [selectedModelKey, setSelectedModelKey] = useState(ModelProviderKeyEnum.DEEPSEEK)

  return (
    <div className="h-full">
      <ModelSidebar value={selectedModelKey} onChange={setSelectedModelKey} />
    </div>
  );
};

export default AddModel;
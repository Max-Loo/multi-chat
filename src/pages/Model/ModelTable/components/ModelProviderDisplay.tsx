import React from 'react';
import { Space, Avatar } from 'antd';
import { ModelProvider, ModelProviderFactoryCreator } from '@/lib/factory/modelProviderFactory';
import { ModelProviderKeyEnum } from '@/utils/enums';

interface ModelProviderDisplayProps {
  providerKey: ModelProviderKeyEnum;
}

// 大模型服务商展示组件
const ModelProviderDisplay: React.FC<ModelProviderDisplayProps> = React.memo(({ providerKey }) => {

  let provider: ModelProvider

  try {
    provider = ModelProviderFactoryCreator.getFactory(providerKey)?.createModelProvider()
  } catch {
    return '123'
  }
  if (!provider) {
    return <span>{providerKey}</span>;
  }

  return (
    <Space>
      {provider.logoUrl && (
        <Avatar
          size={24}
          src={provider.logoUrl}
          alt={provider.name}
        />
      )}
      <span>{provider.name}</span>
    </Space>
  );
});

export default ModelProviderDisplay;
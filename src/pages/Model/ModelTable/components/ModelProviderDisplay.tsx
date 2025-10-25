import React from 'react';
import { Space, Avatar } from 'antd';
import { MODEL_PROVIDERS } from '@/utils/constants';

interface ModelProviderDisplayProps {
  providerKey: string;
}

// 大模型服务商展示组件
const ModelProviderDisplay: React.FC<ModelProviderDisplayProps> = React.memo(({ providerKey }) => {
  const provider = MODEL_PROVIDERS.find(p => p.key === providerKey);

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
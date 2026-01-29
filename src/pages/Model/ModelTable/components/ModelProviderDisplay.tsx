import { memo } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { ModelProvider, getProviderFactory } from '@/lib/factory/modelProviderFactory';
import { ModelProviderKeyEnum } from '@/utils/enums';

interface ModelProviderDisplayProps {
  providerKey: ModelProviderKeyEnum;
}

// 大模型服务商展示组件
const ModelProviderDisplay = memo<ModelProviderDisplayProps>(({ providerKey }) => {

  const provider: ModelProvider = getProviderFactory(providerKey).getModelProvider()

  if (!provider) {
    return <span>{providerKey}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      {provider.logoUrl && (
        <Avatar className="h-6 w-6">
          <img src={provider.logoUrl} alt={provider.name} />
        </Avatar>
      )}
      <span>{provider.name}</span>
    </div>
  );
});

export default ModelProviderDisplay;
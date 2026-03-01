import { memo } from 'react';
import { useSelector } from 'react-redux';
import { Avatar } from '@/components/ui/avatar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { RootState } from '@/store';

interface ModelProviderDisplayProps {
  providerKey: ModelProviderKeyEnum;
}

// 大模型服务商展示组件
const ModelProviderDisplay = memo<ModelProviderDisplayProps>(({ providerKey }) => {
  const provider = useSelector((state: RootState) =>
    state.modelProvider.providers.find(p => p.providerKey === providerKey)
  );

  if (!provider) {
    return <span>{providerKey}</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <img src={`https://models.dev/logos/${provider.providerKey}.svg`} alt={provider.providerName} />
      </Avatar>
      <span>{provider.providerName}</span>
    </div>
  );
});

export default ModelProviderDisplay;
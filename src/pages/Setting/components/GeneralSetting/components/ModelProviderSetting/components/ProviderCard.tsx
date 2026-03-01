import React from 'react';
import { Card } from '@/components/ui/card';
import { RemoteProviderData } from '@/services/modelRemoteService';
import { ProviderCardHeader } from './ProviderCardHeader';
import { ProviderCardSummary } from './ProviderCardSummary';
import { ProviderCardDetails } from './ProviderCardDetails';

/**
 * ProviderCard 组件的属性
 */
interface ProviderCardProps {
  /** 供应商数据 */
  provider: RemoteProviderData;
  /** 是否展开 */
  isExpanded: boolean;
  /** 展开/折叠回调 */
  onToggle: () => void;
  /** 供应商状态（可用/不可用） */
  status: 'available' | 'unavailable';
}

/**
 * 单个供应商卡片组件
 * 显示供应商名称、状态、模型数量等信息
 */
export const ProviderCard = React.memo<ProviderCardProps>(
  ({ provider, isExpanded, onToggle, status }) => {
    return (
      <Card
        className="overflow-hidden transition-all hover:shadow-md cursor-pointer"
        style={{
          willChange: 'transform, opacity',
        }}
        onClick={onToggle}
      >
        <div className="p-4 space-y-3">
          <ProviderCardHeader
            providerName={provider.providerName}
            status={status}
            isExpanded={isExpanded}
          />
          <ProviderCardSummary
            modelCount={provider.models.length}
            isExpanded={isExpanded}
          />
        </div>
        {isExpanded && (
          <div className="border-t">
            <ProviderCardDetails provider={provider} />
          </div>
        )}
      </Card>
    );
  }
);

ProviderCard.displayName = 'ProviderCard';

import React from 'react';
import type { RemoteProviderData } from '@/services/modelRemoteService';
import { ProviderCard } from './ProviderCard';

/**
 * ProviderGrid 组件的属性
 */
interface ProviderGridProps {
  /** 供应商列表 */
  providers: RemoteProviderData[];
  /** 已展开的供应商 ID 集合 */
  expandedProviders: Set<string>;
  /** 展开/折叠回调 */
  onToggleProvider: (providerKey: string) => void;
}

/**
 * 确定供应商状态
 * 这里简单判断：只要有模型就可用
 */
const getProviderStatus = (provider: RemoteProviderData): 'available' | 'unavailable' => {
  return provider.models.length > 0 ? 'available' : 'unavailable';
};

/**
 * 供应商网格组件
 * 使用响应式网格布局展示所有供应商卡片
 */
export const ProviderGrid = React.memo<ProviderGridProps>(
  ({ providers, expandedProviders, onToggleProvider }) => {
    if (providers.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          暂无模型供应商数据
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {providers.map((provider) => (
          <ProviderCard
            key={provider.providerKey}
            provider={provider}
            isExpanded={expandedProviders.has(provider.providerKey)}
            onToggle={() => onToggleProvider(provider.providerKey)}
            status={getProviderStatus(provider)}
          />
        ))}
      </div>
    );
  }
);

ProviderGrid.displayName = 'ProviderGrid';

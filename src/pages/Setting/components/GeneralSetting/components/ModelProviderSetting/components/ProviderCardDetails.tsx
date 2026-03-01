import React, { useState, useMemo, useCallback } from 'react';
import { RemoteProviderData } from '@/services/modelRemoteService';
import { ProviderMetadata } from './ProviderMetadata';
import { ModelSearch } from './ModelSearch';
import { ModelList } from './ModelList';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * ProviderCardDetails 组件的属性
 */
interface ProviderCardDetailsProps {
  /** 供应商数据 */
  provider: RemoteProviderData;
}

/**
 * 供应商卡片详细信息组件
 * 显示供应商元数据、模型搜索框和模型列表
 */
export const ProviderCardDetails = React.memo<ProviderCardDetailsProps>(
  ({ provider }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // 搜索过滤逻辑（使用防抖后的搜索词）
    const filteredModels = useMemo(() => {
      if (!debouncedSearchQuery.trim()) {
        return provider.models;
      }
      const query = debouncedSearchQuery.toLowerCase();
      return provider.models.filter(
        (model) =>
          model.modelName.toLowerCase().includes(query) ||
          model.modelKey.toLowerCase().includes(query)
      );
    }, [provider.models, debouncedSearchQuery]);

    // 搜索框输入处理（立即更新本地状态）
    const handleSearchChange = useCallback((value: string) => {
      setSearchQuery(value);
    }, []);

    return (
      <div className="p-4 space-y-4 bg-muted/30">
        <ProviderMetadata
          apiEndpoint={provider.api}
          providerKey={provider.providerKey}
        />
        <ModelSearch
          value={searchQuery}
          onChange={handleSearchChange}
          resultCount={filteredModels.length}
          totalCount={provider.models.length}
        />
        <ModelList models={filteredModels} />
      </div>
    );
  }
);

ProviderCardDetails.displayName = 'ProviderCardDetails';

import React, { useCallback } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

/**
 * ModelSearch 组件的属性
 */
interface ModelSearchProps {
  /** 搜索框值 */
  value: string;
  /** 值变化回调 */
  onChange: (value: string) => void;
  /** 搜索结果数量 */
  resultCount: number;
  /** 总模型数量 */
  totalCount: number;
}

/**
 * 模型搜索组件
 * 提供搜索框和结果统计
 * 注意：防抖在父组件 ProviderCardDetails 中实现
 */
export const ModelSearch = React.memo<ModelSearchProps>(
  ({ value, onChange, resultCount, totalCount }) => {
    const { t } = useTranslation();

    // 防抖处理（300ms）- 实际防抖在父组件通过 useDebounce hook 实现
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange]
    );

    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t($ => $.setting.modelProvider.searchPlaceholder)}
            value={value}
            onChange={handleChange}
            className="pl-9"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {value.trim() ? (
            <span>{t($ => $.setting.modelProvider.searchResult, { count: resultCount })}</span>
          ) : (
            <span>{t($ => $.setting.modelProvider.totalModels, { count: totalCount })}</span>
          )}
        </div>
      </div>
    );
  }
);

ModelSearch.displayName = 'ModelSearch';

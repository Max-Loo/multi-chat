import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * ProviderCardSummary 组件的属性
 */
interface ProviderCardSummaryProps {
  /** 模型数量 */
  modelCount: number;
  /** 是否展开 */
  isExpanded: boolean;
}

/**
 * 供应商卡片摘要组件
 * 显示模型数量和提示信息
 */
export const ProviderCardSummary = React.memo<ProviderCardSummaryProps>(
  ({ modelCount, isExpanded }) => {
    const { t } = useTranslation();

    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t($ => $.setting.modelProvider.modelCount, { count: modelCount })}</span>
        {!isExpanded && (
          <span className="text-xs">{t($ => $.setting.modelProvider.clickToViewDetails)}</span>
        )}
      </div>
    );
  }
);

ProviderCardSummary.displayName = 'ProviderCardSummary';

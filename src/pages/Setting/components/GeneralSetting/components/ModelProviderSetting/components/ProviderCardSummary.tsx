import React from 'react';

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
    return (
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {modelCount} 个模型</span>
        {!isExpanded && (
          <span className="text-xs">点击查看详情</span>
        )}
      </div>
    );
  }
);

ProviderCardSummary.displayName = 'ProviderCardSummary';

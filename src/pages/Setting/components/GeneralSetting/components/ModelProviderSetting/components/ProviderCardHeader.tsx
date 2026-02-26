import React from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * ProviderCardHeader 组件的属性
 */
interface ProviderCardHeaderProps {
  /** 供应商名称 */
  providerName: string;
  /** 供应商状态 */
  status: 'available' | 'unavailable';
  /** 是否展开 */
  isExpanded: boolean;
}

/**
 * 供应商卡片头部组件
 * 显示供应商名称、状态图标、展开/折叠图标
 */
export const ProviderCardHeader = React.memo<ProviderCardHeaderProps>(
  ({ providerName, status, isExpanded }) => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <span className="text-lg font-bold text-primary">
              {providerName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="font-semibold text-lg">{providerName}</h3>
          {status === 'available' ? (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
              <CheckCircle className="w-3 h-3" />
              可用
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
              <XCircle className="w-3 h-3" />
              不可用
            </Badge>
          )}
        </div>
        <div className="text-muted-foreground">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </div>
    );
  }
);

ProviderCardHeader.displayName = 'ProviderCardHeader';

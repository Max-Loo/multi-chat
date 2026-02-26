import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

/**
 * ProviderHeader 组件的属性
 */
interface ProviderHeaderProps {
  /** 是否正在加载 */
  loading: boolean;
  /** 刷新按钮点击回调 */
  onRefresh: () => void;
  /** 最后更新时间（ISO 8601 格式） */
  lastUpdate: string | null;
}

/**
 * 供应商设置页面头部组件
 * 显示标题、刷新按钮和最后更新时间
 */
export const ProviderHeader = React.memo<ProviderHeaderProps>(
  ({ loading, onRefresh, lastUpdate }) => {
    const formatLastUpdate = () => {
      if (!lastUpdate) return null;
      const date = new Date(lastUpdate);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">模型供应商</h3>
            <p className="text-sm text-muted-foreground">
              从远程服务器获取最新的模型供应商信息
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '刷新中...' : '刷新模型供应商'}
            </Button>

            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                最后更新: {formatLastUpdate()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProviderHeader.displayName = 'ProviderHeader';

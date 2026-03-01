import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const { t, i18n } = useTranslation();

    const formatLastUpdate = () => {
      if (!lastUpdate) return null;
      const date = new Date(lastUpdate);
      const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
      return date.toLocaleString(locale, {
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
            <h3 className="text-lg font-semibold">{t($ => $.setting.modelProvider.title)}</h3>
            <p className="text-sm text-muted-foreground">
              {t($ => $.setting.modelProvider.description)}
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
              {loading ? t($ => $.setting.modelProvider.refreshing) : t($ => $.setting.modelProvider.refreshButton)}
            </Button>

            {lastUpdate && (
              <div className="text-sm text-muted-foreground">
                {t($ => $.setting.modelProvider.lastUpdateLabel)} {formatLastUpdate()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProviderHeader.displayName = 'ProviderHeader';

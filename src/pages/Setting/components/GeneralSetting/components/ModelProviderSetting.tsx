import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshModelProvider } from '@/store/slices/modelProviderSlice';
import { RootState, AppDispatch } from '@/store';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * 模型供应商设置组件
 * 提供手动刷新模型供应商数据的功能
 */
const ModelProviderSetting: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { loading, error, lastUpdate } = useSelector(
    (state: RootState) => state.modelProvider
  );
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // 清理函数：组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  /**
   * 处理刷新按钮点击
   */
  const handleRefresh = () => {
    // 取消之前的请求（如果存在）
    if (abortController) {
      abortController.abort();
    }

    // 创建新的 AbortController
    const controller = new AbortController();
    setAbortController(controller);

    // Dispatch refresh action
    dispatch(refreshModelProvider())
      .unwrap()
      .then(() => {
        toast.success(t($ => $.setting.modelProvider.refreshSuccess));
      })
      .catch((err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : t($ => $.setting.modelProvider.refreshFailed);
        toast.error(errorMessage);
      })
      .finally(() => {
        setAbortController(null);
      });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold">模型供应商</h3>
        <p className="text-sm text-muted-foreground">
          从远程服务器获取最新的模型供应商信息
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleRefresh}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '刷新中...' : '刷新模型供应商'}
        </Button>

        {lastUpdate && (
          <span className="text-sm text-muted-foreground">
            最后更新: {new Date(lastUpdate).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-destructive">
          刷新失败: {error}
        </div>
      )}
    </div>
  );
};

export default ModelProviderSetting;

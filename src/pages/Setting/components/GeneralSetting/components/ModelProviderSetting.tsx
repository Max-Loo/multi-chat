import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshModelProvider } from '@/store/slices/modelProviderSlice';
import { RootState, AppDispatch } from '@/store';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { ProviderHeader } from './ModelProviderSetting/components/ProviderHeader';
import { ProviderGrid } from './ModelProviderSetting/components/ProviderGrid';
import { ErrorAlert } from './ModelProviderSetting/components/ErrorAlert';

const ModelProviderSetting: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { providers, loading, error, lastUpdate } = useSelector(
    (state: RootState) => state.modelProvider
  );
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const handleRefresh = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

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
  }, [dispatch, t, abortController]);

  const handleToggleProvider = useCallback((providerKey: string) => {
    setExpandedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(providerKey)) {
        newSet.delete(providerKey);
      } else {
        newSet.add(providerKey);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <ProviderHeader
        loading={loading}
        onRefresh={handleRefresh}
        lastUpdate={lastUpdate}
      />

      <ErrorAlert error={error} />

      <ProviderGrid
        providers={providers}
        expandedProviders={expandedProviders}
        onToggleProvider={handleToggleProvider}
      />
    </div>
  );
};

export default ModelProviderSetting;

<script setup lang="ts">
/**
 * 模型供应商设置组件（对应旧版 ModelProviderSetting.tsx）
 */
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useModelProviderStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import { useTranslation } from '@/composables/useTranslation';
import ProviderHeader from './components/ProviderHeader.vue';
import ProviderGrid from './components/ProviderGrid.vue';
import ErrorAlert from './components/ErrorAlert.vue';

const modelProviderStore = useModelProviderStore();
const { providers, loading, error, lastUpdate } = storeToRefs(modelProviderStore);
const { t } = useTranslation();

/** 手动刷新供应商数据 */
const handleRefresh = (): void => {
  modelProviderStore
    .refreshModelProvider()
    .then(() => {
      void toastQueue.success(t('setting.modelProvider.refreshSuccess'));
    })
    .catch((err: unknown) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('setting.modelProvider.refreshFailed');
      void toastQueue.error(errorMessage);
    });
};

// 已展开的供应商 Key 集合
const expandedProviders = ref<Set<string>>(new Set());

/** 展开/折叠供应商卡片 */
const handleToggleProvider = (providerKey: string): void => {
  const newSet = new Set(expandedProviders.value);
  if (newSet.has(providerKey)) {
    newSet.delete(providerKey);
  } else {
    newSet.add(providerKey);
  }
  expandedProviders.value = newSet;
};
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <ProviderHeader
      :loading="loading"
      :last-update="lastUpdate"
      @refresh="handleRefresh"
    />

    <ErrorAlert :error="error" />

    <ProviderGrid
      :providers="providers"
      :expanded-providers="expandedProviders"
      @toggle-provider="handleToggleProvider"
    />
  </div>
</template>

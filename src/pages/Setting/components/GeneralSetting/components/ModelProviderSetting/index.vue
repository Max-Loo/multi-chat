<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useModelProviderStore } from '@/store/modelProvider';
import { toastQueue } from '@/services/toast';
import ProviderHeader from './components/ProviderHeader.vue';
import ErrorAlert from './components/ErrorAlert.vue';
import ProviderGrid from './components/ProviderGrid.vue';

/**
 * 模型供应商设置组件
 */
const { t } = useTranslation();
const modelProviderStore = useModelProviderStore();

const providers = computed(() => modelProviderStore.providers);
const loading = computed(() => modelProviderStore.loading);
const error = computed(() => modelProviderStore.error);
const lastUpdate = computed(() => modelProviderStore.lastUpdate);

// 卸载时中止进行中的刷新请求
let abortController: AbortController | null = null;
onBeforeUnmount(() => {
  abortController?.abort();
});

/** 处理刷新 */
function handleRefresh(): void {
  if (abortController) {
    abortController.abort();
  }

  const controller = new AbortController();
  abortController = controller;

  modelProviderStore
    .refreshModelProvider({ signal: controller.signal })
    .then(() => {
      toastQueue.success(t('setting.modelProvider.refreshSuccess'));
    })
    .catch((err: unknown) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('setting.modelProvider.refreshFailed');
      toastQueue.error(errorMessage);
    })
    .finally(() => {
      abortController = null;
    });
}

// 已展开的供应商 Key 集合
const expandedProviders = ref<Set<string>>(new Set());

/**
 * 展开/折叠供应商卡片
 * @param providerKey 供应商 Key
 */
function handleToggleProvider(providerKey: string): void {
  const newSet = new Set(expandedProviders.value);
  if (newSet.has(providerKey)) {
    newSet.delete(providerKey);
  } else {
    newSet.add(providerKey);
  }
  expandedProviders.value = newSet;
}
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <ProviderHeader :loading="loading" :last-update="lastUpdate" @refresh="handleRefresh" />

    <ErrorAlert :error="error" />

    <ProviderGrid
      :providers="providers"
      :expanded-providers="expandedProviders"
      @toggle-provider="handleToggleProvider"
    />
  </div>
</template>

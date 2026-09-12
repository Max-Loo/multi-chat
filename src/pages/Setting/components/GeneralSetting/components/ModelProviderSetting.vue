<script setup lang="ts">
/**
 * 模型供应商设置组件（Vue 版 ModelProviderSetting）
 * 组合头部刷新、错误提示与供应商卡片网格，展开状态与刷新流程本地管理
 */
import { onUnmounted, ref } from 'vue';
import { toastQueue } from '@/services/toast';
import { useTranslation } from '@/composables/useTranslation';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import ProviderHeader from './ModelProviderSetting/components/ProviderHeader.vue';
import ProviderGrid from './ModelProviderSetting/components/ProviderGrid.vue';
import ErrorAlert from './ModelProviderSetting/components/ErrorAlert.vue';

const { t } = useTranslation();
const providerStore = useModelProviderStore();

// 进行中刷新请求的中止控制器
const abortController = ref<AbortController | null>(null);
// 已展开的供应商 Key 集合
const expandedProviders = ref<Set<string>>(new Set());

// 组件卸载时中止进行中的刷新请求
onUnmounted(() => {
  abortController.value?.abort();
});

/** 手动刷新供应商数据（成功/失败均有 Toast 反馈） */
const handleRefresh = () => {
  // 中止上一次未完成的请求
  abortController.value?.abort();

  const controller = new AbortController();
  abortController.value = controller;

  void providerStore
    .refreshModelProvider(controller.signal)
    .then(() => {
      if (providerStore.error) {
        toastQueue.error(providerStore.error);
      } else {
        toastQueue.success(t(($) => $.setting.modelProvider.refreshSuccess));
      }
    })
    .catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : t(($) => $.setting.modelProvider.refreshFailed);
      toastQueue.error(errorMessage);
    })
    .finally(() => {
      abortController.value = null;
    });
};

/**
 * 切换供应商卡片的展开/折叠状态
 * @param providerKey 供应商唯一标识
 */
const handleToggleProvider = (providerKey: string) => {
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
      :loading="providerStore.loading"
      :last-update="providerStore.lastUpdate"
      @refresh="handleRefresh"
    />

    <ErrorAlert :error="providerStore.error" />

    <ProviderGrid
      :providers="providerStore.providers"
      :expanded-providers="expandedProviders"
      @toggle-provider="handleToggleProvider"
    />
  </div>
</template>

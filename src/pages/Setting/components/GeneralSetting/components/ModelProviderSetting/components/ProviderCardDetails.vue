<script setup lang="ts">
/**
 * 供应商卡片详细信息组件（对应旧版 ProviderCardDetails.tsx）
 * 显示供应商元数据、模型搜索框和模型列表
 */
import { computed, ref } from 'vue';
import ProviderMetadata from './ProviderMetadata.vue';
import ModelSearch from './ModelSearch.vue';
import ModelList from './ModelList.vue';
import { useDebounce } from '@/composables/useDebounce';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 组件属性 */
const props = defineProps<{ provider: RemoteProviderData }>();

const searchQuery = ref('');
const debouncedSearchQuery = useDebounce(() => searchQuery.value, 300);

// 搜索过滤逻辑（使用防抖后的搜索词）
const filteredModels = computed(() => {
  if (!debouncedSearchQuery.value.trim()) {
    return props.provider.models;
  }
  const query = debouncedSearchQuery.value.toLowerCase();
  return props.provider.models.filter(
    (model) =>
      model.modelName.toLowerCase().includes(query) ||
      model.modelKey.toLowerCase().includes(query),
  );
});
</script>

<template>
  <div class="space-y-4 bg-muted/30 p-4">
    <ProviderMetadata :api-endpoint="props.provider.api" :provider-key="props.provider.providerKey" />
    <ModelSearch
      :model-value="searchQuery"
      :result-count="filteredModels.length"
      :total-count="props.provider.models.length"
      @update:model-value="(value: string) => (searchQuery = value)"
    />
    <ModelList :models="filteredModels" />
  </div>
</template>

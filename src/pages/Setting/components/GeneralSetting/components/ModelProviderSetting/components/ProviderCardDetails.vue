<script setup lang="ts">
/**
 * 供应商卡片详细信息组件（Vue 版 ProviderCardDetails）
 * 显示供应商元数据、模型搜索框和模型列表；搜索过滤带 300ms 防抖
 */
import { computed, ref } from 'vue';
import type { RemoteProviderData } from '@/services/modelRemote';
import ProviderMetadata from './ProviderMetadata.vue';
import ModelSearch from './ModelSearch.vue';
import ModelList from './ModelList.vue';
import { useDebounce } from '@/composables/useDebounce';

const props = defineProps<{
  /** 供应商数据 */
  provider: RemoteProviderData;
}>();

// 搜索框输入（立即更新本地状态）
const searchQuery = ref('');
// 防抖后的搜索词
const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

/**
 * 搜索框输入处理
 * @param value 新的搜索词
 */
const handleSearchChange = (value: string) => {
  searchQuery.value = value;
};
</script>

<template>
  <div class="space-y-4 bg-muted/30 p-4">
    <ProviderMetadata
      :api-endpoint="props.provider.api"
      :provider-key="props.provider.providerKey"
    />
    <ModelSearch
      :value="searchQuery"
      :result-count="filteredModels.length"
      :total-count="props.provider.models.length"
      @change="handleSearchChange"
    />
    <ModelList :models="filteredModels" />
  </div>
</template>

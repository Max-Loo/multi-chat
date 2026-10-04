<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RemoteProviderData } from '@/services/modelRemote';
import ProviderMetadata from './ProviderMetadata.vue';
import ModelSearch from './ModelSearch.vue';
import ModelList from './ModelList.vue';
import { useDebounce } from '@/composables/useDebounce';

/**
 * 供应商卡片详细信息组件属性
 */
interface ProviderCardDetailsProps {
  /** 供应商数据 */
  provider: RemoteProviderData;
}

const props = defineProps<ProviderCardDetailsProps>();

// 搜索词（立即更新）与防抖后的搜索词
const searchQuery = ref('');
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
 * 搜索框输入处理（立即更新本地状态）
 * @param value 输入值
 */
function handleSearchChange(value: string): void {
  searchQuery.value = value;
}
</script>

<!-- 供应商卡片详细信息：元数据、模型搜索框和模型列表 -->
<template>
  <div class="p-4 space-y-4 bg-muted/30">
    <ProviderMetadata :api-endpoint="props.provider.api" :provider-key="props.provider.providerKey" />
    <ModelSearch
      :value="searchQuery"
      :result-count="filteredModels.length"
      :total-count="props.provider.models.length"
      @change="handleSearchChange"
    />
    <ModelList :models="filteredModels" />
  </div>
</template>

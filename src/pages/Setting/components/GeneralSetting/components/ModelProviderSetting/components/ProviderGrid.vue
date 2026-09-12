<script setup lang="ts">
/**
 * 供应商网格组件（Vue 版 ProviderGrid）
 * 使用响应式瀑布流布局展示所有供应商卡片
 * 断点与 React 版 react-masonry-css 配置一致：默认 3 列、≥1024px 1 列、≥1560px 2 列
 * （react-masonry-css 本质是 CSS columns 方案，此处直接以样式实现）
 */
import { computed } from 'vue';
import type { RemoteProviderData } from '@/services/modelRemote';
import { useMediaQuery } from '@/composables/useMediaQuery';
import ProviderCard from './ProviderCard.vue';

defineProps<{
  /** 供应商列表 */
  providers: RemoteProviderData[];
  /** 已展开的供应商 ID 集合 */
  expandedProviders: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'toggleProvider', providerKey: string): void;
}>();

// 瀑布流响应式断点（与 React 版 breakpointColumnsObj 语义一致）
const isXl = useMediaQuery('(min-width: 1560px)', false);
const isLg = useMediaQuery('(min-width: 1024px)', false);
const cols = computed(() => (isXl.value ? 2 : isLg.value ? 1 : 3));

/** 容器样式：列数 + 列间距（负 margin 补偿首列内边距） */
const gridStyle = computed(() => ({
  columnCount: cols.value,
  columnGap: '1rem',
  marginLeft: '-1rem',
}));

/** 条目样式：列内间距 + 防止跨列断开 */
const itemStyle = {
  paddingLeft: '1rem',
  marginBottom: '1rem',
  breakInside: 'avoid' as const,
};

/**
 * 确定供应商状态（简单判断：只要有模型就可用）
 * @param provider 供应商数据
 */
const getProviderStatus = (provider: RemoteProviderData): 'available' | 'unavailable' => {
  return provider.models.length > 0 ? 'available' : 'unavailable';
};

/**
 * 切换供应商展开状态
 * @param providerKey 供应商唯一标识
 */
const handleToggle = (providerKey: string) => {
  emit('toggleProvider', providerKey);
};
</script>

<template>
  <div v-if="providers.length === 0" class="py-8 text-center text-muted-foreground">
    暂无模型供应商数据
  </div>

  <div v-else class="w-full" :style="gridStyle">
    <div v-for="provider in providers" :key="provider.providerKey" :style="itemStyle">
      <ProviderCard
        :provider="provider"
        :is-expanded="expandedProviders.has(provider.providerKey)"
        :status="getProviderStatus(provider)"
        @toggle="handleToggle(provider.providerKey)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import MasonryGrid from '@/components/ui/masonry/MasonryGrid.vue';
import type { RemoteProviderData } from '@/services/modelRemote';
import ProviderCard from './ProviderCard.vue';

/**
 * ProviderGrid 组件的属性
 */
interface ProviderGridProps {
  /** 供应商列表 */
  providers: RemoteProviderData[];
  /** 已展开的供应商 Key 集合 */
  expandedProviders: Set<string>;
}

const props = defineProps<ProviderGridProps>();

const emit = defineEmits<{
  /** 展开/折叠回调 */
  (e: 'toggleProvider', providerKey: string): void;
}>();

/**
 * 确定供应商状态（只要有模型就可用）
 * @param provider 供应商数据
 */
function getProviderStatus(provider: RemoteProviderData): 'available' | 'unavailable' {
  return provider.models.length > 0 ? 'available' : 'unavailable';
}

/**
 * 判断供应商是否展开
 * @param provider 供应商数据
 */
function isExpanded(provider: RemoteProviderData): boolean {
  return props.expandedProviders.has(provider.providerKey);
}

/** 空状态文案（与迁移前一致的说明性文字） */
const emptyText = '暂无模型供应商数据';

/** Masonry 响应式断点配置（与迁移前一致） */
const breakpointCols = computed(() => ({
  default: 3,
  1560: 2,
  1024: 1,
}));
</script>

<!--
  供应商网格组件
  使用 CSS columns 瀑布流布局展示所有供应商卡片
-->
<template>
  <div v-if="props.providers.length === 0" class="text-center py-8 text-muted-foreground">
    {{ emptyText }}
  </div>

  <MasonryGrid v-else :breakpoint-cols="breakpointCols">
    <div
      v-for="provider in props.providers"
      :key="provider.providerKey"
      class="mb-4 break-inside-avoid"
    >
      <ProviderCard
        :provider="provider"
        :is-expanded="isExpanded(provider)"
        :status="getProviderStatus(provider)"
        @toggle="emit('toggleProvider', provider.providerKey)"
      />
    </div>
  </MasonryGrid>
</template>

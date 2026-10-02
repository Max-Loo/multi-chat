<script setup lang="ts">
/**
 * 供应商网格组件（对应旧版 ProviderGrid.tsx）
 * 使用瀑布流布局展示所有供应商卡片（Vue 版 Masonry）
 */
import { computed } from 'vue';
import { Masonry } from '@/components/Masonry';
import ProviderCard from './ProviderCard.vue';
import type { RemoteProviderData } from '@/services/modelRemote';

/**
 * 组件属性
 */
interface Props {
  /** 供应商列表 */
  providers: RemoteProviderData[];
  /** 已展开的供应商 Key 集合 */
  expandedProviders: Set<string>;
}

const props = defineProps<Props>();

/** 展开/折叠供应商事件 */
const emit = defineEmits<{
  'toggle-provider': [providerKey: string];
}>();

/**
 * 确定供应商状态
 * 这里简单判断：只要有模型就可用
 */
const getProviderStatus = (provider: RemoteProviderData): 'available' | 'unavailable' => {
  return provider.models.length > 0 ? 'available' : 'unavailable';
};

/**
 * Masonry 响应式断点配置（min-width 语义，见 masonry-layout spec）
 * - 小屏幕（< 1024px）：3 列
 * - 中等屏幕（≥ 1024px）：1 列
 * - 超大屏幕（≥ 1560px）：2 列
 */
const breakpointColumnsObj = {
  default: 3,
  1024: 1,
  1560: 2,
};

// 供模板使用的 providers 别名
const providerList = computed(() => props.providers);
</script>

<template>
  <div v-if="providerList.length === 0" class="py-8 text-center text-muted-foreground">
    暂无模型供应商数据
  </div>
  <Masonry
    v-else
    :breakpoint-cols="breakpointColumnsObj"
    class-name="flex w-full -ml-4"
    column-class-name="pl-4"
  >
    <div
      v-for="provider in providerList"
      :key="provider.providerKey"
      class="mb-4 break-inside-avoid"
    >
      <ProviderCard
        :provider="provider"
        :is-expanded="expandedProviders.has(provider.providerKey)"
        :status="getProviderStatus(provider)"
        @toggle-provider="emit('toggle-provider', provider.providerKey)"
      />
    </div>
  </Masonry>
</template>

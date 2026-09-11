<script setup lang="ts">
/**
 * 虚拟滚动列表（Vue 版，基于 virtua/vue VList 的薄包装）
 * 提供与 React 版 virtua 用法等价的虚拟化能力
 */
import { VList } from 'virtua/vue';

const props = withDefaults(
  defineProps<{
    /** 列表数据（虚拟化数据源） */
    items: unknown[];
    /** 容器高度（像素），默认撑满父容器 */
    height?: string;
    class?: string;
  }>(),
  { height: '100%' },
);
</script>

<template>
  <VList :data="props.items" :style="{ height: props.height }" :class="props.class" data-testid="virtual-list">
    <template #default="{ item, index }">
      <slot name="item" :item="item" :index="index" />
    </template>
  </VList>
</template>

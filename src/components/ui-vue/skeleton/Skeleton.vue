<script setup lang="ts">
/**
 * 骨架屏组件（shadcn-vue 版）
 * 类名体系与 React 版 shadcn/ui Skeleton 保持一致
 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div :class="cn('animate-pulse rounded-md bg-primary/20', props.class)" />
</template>

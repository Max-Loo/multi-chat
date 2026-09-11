<script setup lang="ts">
/**
 * 输入框组件（shadcn-vue 版）
 * 类名体系与 React 版 shadcn/ui Input 保持一致
 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();

const model = defineModel<string | number>();
</script>

<template>
  <input
    v-model="model"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  />
</template>

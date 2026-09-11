<script setup lang="ts">
/**
 * 多行文本框组件（shadcn-vue 版）
 * 类名体系与 React 版 shadcn/ui Textarea 保持一致
 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();

const model = defineModel<string>();
</script>

<template>
  <textarea
    v-model="model"
    :class="cn(
      'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class,
    )"
  />
</template>

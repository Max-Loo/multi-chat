<script setup lang="ts">
/**
 * 选择器触发器（shadcn-vue 版，基于 reka-ui Select）
 * 类名体系与 React 版 shadcn/ui SelectTrigger 保持一致
 */
import { SelectIcon, SelectTrigger } from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; disabled?: boolean }>();
</script>

<template>
  <SelectTrigger
    :disabled="props.disabled"
    :class="cn(
      'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>

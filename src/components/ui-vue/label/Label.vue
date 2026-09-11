<script setup lang="ts">
/**
 * 标签组件（shadcn-vue 版，基于 reka-ui Label）
 * 类名体系与 React 版 shadcn/ui Label 保持一致
 */
import { Label } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string; for?: string }>();
</script>

<template>
  <Label
    :for="props.for"
    :class="cn(
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      props.class,
    )"
  >
    <slot />
  </Label>
</template>

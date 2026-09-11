<script setup lang="ts">
/**
 * 进度条组件（shadcn-vue 版，基于 reka-ui Progress）
 * 类名体系与 React 版 shadcn/ui Progress 保持一致
 */
import { ProgressRoot, ProgressIndicator } from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<{ modelValue?: number; class?: string }>();
</script>

<template>
  <ProgressRoot
    :model-value="props.modelValue ?? 0"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="{ transform: `translateX(-${100 - (props.modelValue ?? 0)}%)` }"
    />
  </ProgressRoot>
</template>

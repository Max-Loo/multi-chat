<script setup lang="ts">
/**
 * 卡片组件（shadcn-vue 版）
 * 类名体系与 React 版 shadcn/ui Card 保持一致
 */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div
    :class="cn('rounded-xl border bg-card text-card-foreground shadow', props.class)"
  >
    <slot />
  </div>
</template>

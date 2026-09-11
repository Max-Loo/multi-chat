<script setup lang="ts">
/** 表格容器（shadcn-vue 版，类名与 React 版 Table 保持一致） */
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div :class="cn('relative w-full overflow-auto', props.class)">
    <table class="w-full caption-bottom text-sm">
      <slot />
    </table>
  </div>
</template>

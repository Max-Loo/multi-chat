<script setup lang="ts">
/**
 * 表格容器（对应旧版 table.tsx 的 Table）
 * 外层 div 提供横向滚动
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('w-full caption-bottom text-sm', props.class));
</script>

<template>
  <div class="relative w-full overflow-auto">
    <table :class="classes">
      <slot />
    </table>
  </div>
</template>

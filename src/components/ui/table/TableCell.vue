<script setup lang="ts">
/**
 * 表格单元格（对应旧版 table.tsx 的 TableCell）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn(
    'p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    props.class,
  ),
);
</script>

<template>
  <td :class="classes">
    <slot />
  </td>
</template>

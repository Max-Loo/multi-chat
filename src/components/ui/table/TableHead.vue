<script setup lang="ts">
/**
 * 表头单元格（对应旧版 table.tsx 的 TableHead）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn(
    'h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
    props.class,
  ),
);
</script>

<template>
  <th :class="classes">
    <slot />
  </th>
</template>

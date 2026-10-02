<script setup lang="ts">
/**
 * 分页省略号（对应旧版 pagination.tsx 的 PaginationEllipsis）
 */
import { computed, type HTMLAttributes } from 'vue';
import { MoreHorizontal } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('flex h-9 w-9 items-center justify-center', props.class),
);
</script>

<template>
  <span aria-hidden :class="classes">
    <MoreHorizontal class="h-4 w-4" />
    <span class="sr-only">More pages</span>
  </span>
</template>

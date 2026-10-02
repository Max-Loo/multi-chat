<script setup lang="ts">
/**
 * 分页内容列表（对应旧版 pagination.tsx 的 PaginationContent）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('flex flex-row items-center gap-1', props.class));
</script>

<template>
  <ul :class="classes">
    <slot />
  </ul>
</template>

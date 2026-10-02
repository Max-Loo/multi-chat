<script setup lang="ts">
/**
 * 分页容器（对应旧版 pagination.tsx 的 Pagination）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('mx-auto flex w-full justify-center', props.class));
</script>

<template>
  <nav role="navigation" aria-label="pagination" :class="classes">
    <slot />
  </nav>
</template>

<script setup lang="ts">
/**
 * 分页列表项（对应旧版 pagination.tsx 的 PaginationItem）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('', props.class));
</script>

<template>
  <li :class="classes">
    <slot />
  </li>
</template>

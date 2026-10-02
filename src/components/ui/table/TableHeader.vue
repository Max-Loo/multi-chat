<script setup lang="ts">
/**
 * 表头区（对应旧版 table.tsx 的 TableHeader）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('[&_tr]:border-b', props.class));
</script>

<template>
  <thead :class="classes">
    <slot />
  </thead>
</template>

<script setup lang="ts">
/**
 * 表体区（对应旧版 table.tsx 的 TableBody）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('[&_tr:last-child]:border-0', props.class));
</script>

<template>
  <tbody :class="classes">
    <slot />
  </tbody>
</template>

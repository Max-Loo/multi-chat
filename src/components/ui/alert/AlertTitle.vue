<script setup lang="ts">
/**
 * 警告标题组件（对应旧版 alert.tsx 的 AlertTitle）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('mb-1 font-medium leading-none tracking-tight', props.class));
</script>

<template>
  <h5 :class="classes">
    <slot />
  </h5>
</template>

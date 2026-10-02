<script setup lang="ts">
/**
 * 警告提示组件（对应旧版 alert.tsx 的 Alert）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';
import { alertVariants } from './alertVariants';

const props = defineProps<{
  variant?: 'default' | 'destructive' | null;
  class?: HTMLAttributes['class'];
}>();

const classes = computed(() => cn(alertVariants({ variant: props.variant }), props.class));
</script>

<template>
  <div role="alert" :class="classes">
    <slot />
  </div>
</template>

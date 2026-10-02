<script setup lang="ts">
/**
 * 警告描述组件（对应旧版 alert.tsx 的 AlertDescription）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('text-sm [&_p]:leading-relaxed', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * 对话框头部组件（对应旧版 dialog.tsx 的 DialogHeader）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('flex flex-col space-y-1.5 text-center sm:text-left', props.class),
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

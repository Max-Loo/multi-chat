<script setup lang="ts">
/**
 * 对话框底部组件（对应旧版 dialog.tsx 的 DialogFooter）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', props.class),
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

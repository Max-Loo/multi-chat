<script setup lang="ts">
/**
 * 确认对话框底部（对应旧版 alert-dialog.tsx 的 AlertDialogFooter）
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

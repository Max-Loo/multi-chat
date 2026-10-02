<script setup lang="ts">
/**
 * 确认对话框头部（对应旧版 alert-dialog.tsx 的 AlertDialogHeader）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('flex flex-col space-y-2 text-center sm:text-left', props.class),
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

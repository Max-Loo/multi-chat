<script setup lang="ts">
/**
 * 侧滑面板底部（对应旧版 sheet.tsx 的 SheetFooter）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('mt-auto flex flex-col gap-2 p-4', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

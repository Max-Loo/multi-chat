<script setup lang="ts">
/**
 * 侧滑面板头部（对应旧版 sheet.tsx 的 SheetHeader）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('flex flex-col gap-1.5 p-4', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * 卡片头部组件（对应旧版 card.tsx 的 CardHeader）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('flex flex-col space-y-1.5 p-6', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

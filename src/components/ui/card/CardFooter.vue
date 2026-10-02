<script setup lang="ts">
/**
 * 卡片底部组件（对应旧版 card.tsx 的 CardFooter）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('flex items-center p-6 pt-0', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

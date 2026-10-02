<script setup lang="ts">
/**
 * 卡片内容组件（对应旧版 card.tsx 的 CardContent）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('p-6 pt-0', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
/**
 * 卡片描述组件（对应旧版 card.tsx 的 CardDescription）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('text-sm text-muted-foreground', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

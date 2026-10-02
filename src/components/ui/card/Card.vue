<script setup lang="ts">
/**
 * 卡片容器组件（对应旧版 card.tsx 的 Card）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() =>
  cn('rounded-xl border bg-card text-card-foreground shadow', props.class),
);
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

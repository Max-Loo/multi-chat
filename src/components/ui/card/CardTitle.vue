<script setup lang="ts">
/**
 * 卡片标题组件（对应旧版 card.tsx 的 CardTitle）
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();

const classes = computed(() => cn('font-semibold leading-none tracking-tight', props.class));
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

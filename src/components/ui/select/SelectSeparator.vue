<script setup lang="ts">
/**
 * 选择器分隔线（对应旧版 select.tsx 的 SelectSeparator）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectSeparator as RekaSelectSeparator,
  type SelectSeparatorProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectSeparatorProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('-mx-1 my-1 h-px bg-muted', props.class));
</script>

<template>
  <RekaSelectSeparator v-bind="delegatedProps" :class="classes" />
</template>

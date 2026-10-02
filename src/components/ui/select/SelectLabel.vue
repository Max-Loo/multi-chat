<script setup lang="ts">
/**
 * 选择器分组标签（对应旧版 select.tsx 的 SelectLabel）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectLabel as RekaSelectLabel,
  type SelectLabelProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectLabelProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() => cn('px-2 py-1.5 text-sm font-semibold', props.class));
</script>

<template>
  <RekaSelectLabel v-bind="delegatedProps" :class="classes">
    <slot />
  </RekaSelectLabel>
</template>

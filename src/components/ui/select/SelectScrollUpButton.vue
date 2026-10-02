<script setup lang="ts">
/**
 * 选择器向上滚动按钮（对应旧版 select.tsx 的 SelectScrollUpButton）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectScrollUpButton as RekaSelectScrollUpButton,
  type SelectScrollUpButtonProps,
} from 'reka-ui';
import { ChevronUp } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectScrollUpButtonProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});

const classes = computed(() =>
  cn('flex cursor-default items-center justify-center py-1', props.class),
);
</script>

<template>
  <RekaSelectScrollUpButton v-bind="delegatedProps" :class="classes">
    <slot>
      <ChevronUp class="h-4 w-4" />
    </slot>
  </RekaSelectScrollUpButton>
</template>

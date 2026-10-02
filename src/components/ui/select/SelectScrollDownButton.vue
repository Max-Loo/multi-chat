<script setup lang="ts">
/**
 * 选择器向下滚动按钮（对应旧版 select.tsx 的 SelectScrollDownButton）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectScrollDownButton as RekaSelectScrollDownButton,
  type SelectScrollDownButtonProps,
} from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectScrollDownButtonProps & { class?: HTMLAttributes['class'] }
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
  <RekaSelectScrollDownButton v-bind="delegatedProps" :class="classes">
    <slot>
      <ChevronDown class="h-4 w-4" />
    </slot>
  </RekaSelectScrollDownButton>
</template>

<script setup lang="ts">
/**
 * 选择器内容面板（对应旧版 select.tsx 的 SelectContent）
 * 默认 popper 定位，含上下滚动按钮
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectPortal,
  SelectContent as RekaSelectContent,
  SelectViewport,
  useForwardPropsEmits,
  type SelectContentProps,
  type SelectContentEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';
import SelectScrollUpButton from './SelectScrollUpButton.vue';
import SelectScrollDownButton from './SelectScrollDownButton.vue';

const props = withDefaults(
  defineProps<
    SelectContentProps & { class?: HTMLAttributes['class'] }
  >(),
  { position: 'popper' },
);
const emits = defineEmits<SelectContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'relative z-50 max-h-[var(--reka-select-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--reka-select-content-transform-origin]',
    props.position === 'popper' &&
      'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
    props.class,
  ),
);

const viewportClasses = computed(() =>
  cn(
    'p-1',
    props.position === 'popper' &&
      'h-[var(--reka-select-trigger-height)] w-full min-w-[var(--reka-select-trigger-width)]',
  ),
);
</script>

<template>
  <SelectPortal>
    <RekaSelectContent v-bind="forwarded" :class="classes">
      <SelectScrollUpButton />
      <SelectViewport :class="viewportClasses">
        <slot />
      </SelectViewport>
      <SelectScrollDownButton />
    </RekaSelectContent>
  </SelectPortal>
</template>

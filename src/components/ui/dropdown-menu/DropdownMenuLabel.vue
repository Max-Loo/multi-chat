<script setup lang="ts">
/**
 * 下拉菜单标签（对应旧版 dropdown-menu.tsx 的 DropdownMenuLabel）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuLabel as RekaDropdownMenuLabel,
  useForwardProps,
  type DropdownMenuLabelProps,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuLabelProps & {
    class?: HTMLAttributes['class'];
    inset?: boolean;
  }
>();

const delegatedProps = computed(() => {
  const { class: _, inset: __, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardProps(delegatedProps);

const classes = computed(() =>
  cn('px-2 py-1.5 text-sm font-semibold', props.inset && 'pl-8', props.class),
);
</script>

<template>
  <RekaDropdownMenuLabel v-bind="forwarded" :class="classes">
    <slot />
  </RekaDropdownMenuLabel>
</template>

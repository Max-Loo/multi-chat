<script setup lang="ts">
/**
 * 选择器触发器（对应旧版 select.tsx 的 SelectTrigger）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectIcon,
  SelectTrigger as RekaSelectTrigger,
  useForwardProps,
  type SelectTriggerProps,
} from 'reka-ui';
import { ChevronDown } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectTriggerProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardProps(delegatedProps);

const classes = computed(() =>
  cn(
    'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    props.class,
  ),
);
</script>

<template>
  <RekaSelectTrigger v-bind="forwarded" :class="classes">
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </RekaSelectTrigger>
</template>

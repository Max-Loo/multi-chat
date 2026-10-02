<script setup lang="ts">
/**
 * 单选项组件（对应旧版 radio-group.tsx 的 RadioGroupItem）
 */
import { computed } from 'vue';
import {
  RadioGroupItem as RekaRadioGroupItem,
  RadioGroupIndicator,
  useForwardProps,
  type RadioGroupItemProps,
} from 'reka-ui';
import { Circle } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  RadioGroupItemProps & { class?: HTMLAttributes['class'] }
>();

// 转发除 class 外的 props
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardProps(delegatedProps);

const classes = computed(() =>
  cn(
    'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
);
</script>

<template>
  <RekaRadioGroupItem v-bind="forwarded" :class="classes">
    <RadioGroupIndicator class="flex items-center justify-center">
      <Circle class="h-3.5 w-3.5 fill-primary" />
    </RadioGroupIndicator>
  </RekaRadioGroupItem>
</template>

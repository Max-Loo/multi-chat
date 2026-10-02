<script setup lang="ts">
/**
 * 单选组容器组件（对应旧版 radio-group.tsx 的 RadioGroup）
 */
import { computed } from 'vue';
import {
  RadioGroupRoot,
  useForwardPropsEmits,
  type RadioGroupRootProps,
  type RadioGroupRootEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  RadioGroupRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<RadioGroupRootEmits>();

// 转发 props 与事件（v-model 语义）
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() => cn('grid gap-2', props.class));
</script>

<template>
  <RadioGroupRoot v-bind="forwarded" :class="classes">
    <slot />
  </RadioGroupRoot>
</template>

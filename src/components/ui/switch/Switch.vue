<script setup lang="ts">
/**
 * 开关组件（对应旧版 switch.tsx）
 * 基于 Reka UI Switch，支持 v-model
 */
import { computed } from 'vue';
import {
  SwitchRoot,
  SwitchThumb,
  useForwardPropsEmits,
  type SwitchRootProps,
  type SwitchRootEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  SwitchRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<SwitchRootEmits>();

// 转发 props 与事件（checked 的 v-model 语义）
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
    props.class,
  ),
);

const thumbClasses = computed(() =>
  cn(
    'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
  ),
);
</script>

<template>
  <SwitchRoot v-bind="forwarded" :class="classes">
    <SwitchThumb :class="thumbClasses" />
  </SwitchRoot>
</template>

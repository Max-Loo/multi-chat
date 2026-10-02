<script setup lang="ts">
/**
 * 复选框组件（对应旧版 checkbox.tsx）
 * 基于 Reka UI Checkbox，支持 v-model
 */
import { computed } from 'vue';
import {
  CheckboxRoot,
  CheckboxIndicator,
  useForwardPropsEmits,
  type CheckboxRootProps,
  type CheckboxRootEmits,
} from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  CheckboxRootProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<CheckboxRootEmits>();

// 转发 props 与事件（checked 的 v-model 语义）
const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    props.class,
  ),
);
</script>

<template>
  <CheckboxRoot v-bind="forwarded" :class="classes">
    <CheckboxIndicator class="grid place-content-center text-current">
      <Check class="h-4 w-4" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>

<script setup lang="ts">
/**
 * 选择器选项（对应旧版 select.tsx 的 SelectItem）
 * 右侧显示选中指示
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  SelectItem as RekaSelectItem,
  SelectItemIndicator,
  SelectItemText,
  useForwardPropsEmits,
  type SelectItemProps,
  type SelectItemEmits,
} from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  SelectItemProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<SelectItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    props.class,
  ),
);
</script>

<template>
  <RekaSelectItem v-bind="forwarded" :class="classes">
    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </RekaSelectItem>
</template>

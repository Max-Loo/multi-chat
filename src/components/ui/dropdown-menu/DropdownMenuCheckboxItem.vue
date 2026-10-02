<script setup lang="ts">
/**
 * 下拉菜单复选项（对应旧版 dropdown-menu.tsx 的 DropdownMenuCheckboxItem）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuCheckboxItem as RekaDropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
  useForwardPropsEmits,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuCheckboxItemEmits,
} from 'reka-ui';
import { Check } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<DropdownMenuCheckboxItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    props.class,
  ),
);
</script>

<template>
  <RekaDropdownMenuCheckboxItem v-bind="forwarded" :class="classes">
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Check class="h-4 w-4" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </RekaDropdownMenuCheckboxItem>
</template>

<script setup lang="ts">
/**
 * 下拉菜单项（对应旧版 dropdown-menu.tsx 的 DropdownMenuItem）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuItem as RekaDropdownMenuItem,
  useForwardPropsEmits,
  type DropdownMenuItemProps,
  type DropdownMenuItemEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuItemProps & {
    class?: HTMLAttributes['class'];
    inset?: boolean;
  }
>();
const emits = defineEmits<DropdownMenuItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, inset: __, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
    props.inset && 'pl-8',
    props.class,
  ),
);
</script>

<template>
  <RekaDropdownMenuItem v-bind="forwarded" :class="classes">
    <slot />
  </RekaDropdownMenuItem>
</template>

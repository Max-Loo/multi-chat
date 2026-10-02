<script setup lang="ts">
/**
 * 下拉菜单内容（对应旧版 dropdown-menu.tsx 的 DropdownMenuContent）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuPortal,
  DropdownMenuContent as RekaDropdownMenuContent,
  useForwardPropsEmits,
  type DropdownMenuContentProps,
  type DropdownMenuContentEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<
    DropdownMenuContentProps & { class?: HTMLAttributes['class'] }
  >(),
  { sideOffset: 4 },
);
const emits = defineEmits<DropdownMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'z-50 max-h-[var(--reka-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
    'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--reka-dropdown-menu-content-transform-origin]',
    props.class,
  ),
);
</script>

<template>
  <DropdownMenuPortal>
    <RekaDropdownMenuContent v-bind="forwarded" :class="classes">
      <slot />
    </RekaDropdownMenuContent>
  </DropdownMenuPortal>
</template>

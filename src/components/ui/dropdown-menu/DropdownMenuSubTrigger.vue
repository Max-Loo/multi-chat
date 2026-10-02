<script setup lang="ts">
/**
 * 子菜单触发项（对应旧版 dropdown-menu.tsx 的 DropdownMenuSubTrigger）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuSubTrigger as RekaDropdownMenuSubTrigger,
  useForwardProps,
  type DropdownMenuSubTriggerProps,
} from 'reka-ui';
import { ChevronRight } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuSubTriggerProps & {
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
  cn(
    'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    props.inset && 'pl-8',
    props.class,
  ),
);
</script>

<template>
  <RekaDropdownMenuSubTrigger v-bind="forwarded" :class="classes">
    <slot />
    <ChevronRight class="ml-auto" />
  </RekaDropdownMenuSubTrigger>
</template>

<script setup lang="ts">
/**
 * 下拉菜单单选项（对应旧版 dropdown-menu.tsx 的 DropdownMenuRadioItem）
 */
import { computed, type HTMLAttributes } from 'vue';
import {
  DropdownMenuRadioItem as RekaDropdownMenuRadioItem,
  DropdownMenuItemIndicator,
  useForwardPropsEmits,
  type DropdownMenuRadioItemProps,
  type DropdownMenuRadioItemEmits,
} from 'reka-ui';
import { Circle } from 'lucide-vue-next';
import { cn } from '@/utils/utils';

const props = defineProps<
  DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }
>();
const emits = defineEmits<DropdownMenuRadioItemEmits>();

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
  <RekaDropdownMenuRadioItem v-bind="forwarded" :class="classes">
    <span class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuItemIndicator>
        <Circle class="h-2 w-2 fill-current" />
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </RekaDropdownMenuRadioItem>
</template>

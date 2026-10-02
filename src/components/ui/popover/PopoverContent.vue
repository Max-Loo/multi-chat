<script setup lang="ts">
/**
 * 气泡卡片内容（对应旧版 popover.tsx 的 PopoverContent）
 */
import { computed } from 'vue';
import {
  PopoverPortal,
  PopoverContent as RekaPopoverContent,
  useForwardPropsEmits,
  type PopoverContentProps,
  type PopoverContentEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<
    PopoverContentProps & { class?: HTMLAttributes['class'] }
  >(),
  { align: 'center', sideOffset: 4 },
);
const emits = defineEmits<PopoverContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--reka-popover-content-transform-origin]',
    props.class,
  ),
);
</script>

<template>
  <PopoverPortal>
    <RekaPopoverContent v-bind="forwarded" :class="classes">
      <slot />
    </RekaPopoverContent>
  </PopoverPortal>
</template>

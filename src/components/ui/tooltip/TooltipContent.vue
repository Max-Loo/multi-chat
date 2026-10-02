<script setup lang="ts">
/**
 * 工具提示内容（对应旧版 tooltip.tsx 的 TooltipContent）
 */
import { computed } from 'vue';
import {
  TooltipPortal,
  TooltipContent as RekaTooltipContent,
  useForwardPropsEmits,
  type TooltipContentProps,
  type TooltipContentEmits,
} from 'reka-ui';
import { cn } from '@/utils/utils';

const props = withDefaults(
  defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(),
  { sideOffset: 4 },
);
const emits = defineEmits<TooltipContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;
  return delegated;
});
const forwarded = useForwardPropsEmits(delegatedProps, emits);

const classes = computed(() =>
  cn(
    'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--reka-tooltip-content-transform-origin]',
    props.class,
  ),
);
</script>

<template>
  <TooltipPortal>
    <RekaTooltipContent v-bind="forwarded" :class="classes">
      <slot />
    </RekaTooltipContent>
  </TooltipPortal>
</template>

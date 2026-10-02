<script setup lang="ts">
/**
 * 工具提示根组件（对应旧版 tooltip.tsx 的 Tooltip）
 */
import {
  TooltipRoot,
  useForwardPropsEmits,
  type TooltipRootProps,
  type TooltipRootEmits,
} from 'reka-ui';

const props = defineProps<TooltipRootProps>();
const emits = defineEmits<TooltipRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <TooltipRoot v-bind="forwarded">
    <slot />
  </TooltipRoot>
</template>

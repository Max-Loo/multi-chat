<script setup lang="ts">
/**
 * 工具提示触发器（对应旧版 tooltip.tsx 的 TooltipTrigger）
 */
import { TooltipTrigger, useForwardProps, type TooltipTriggerProps } from 'reka-ui';

const props = defineProps<TooltipTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <TooltipTrigger v-bind="forwarded">
    <slot />
  </TooltipTrigger>
</template>

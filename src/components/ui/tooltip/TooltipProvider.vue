<script setup lang="ts">
/**
 * 工具提示提供者（对应旧版 tooltip.tsx 的 TooltipProvider）
 */
import {
  TooltipProvider as RekaTooltipProvider,
  type TooltipProviderProps,
} from 'reka-ui';

const props = defineProps<TooltipProviderProps>();
</script>

<template>
  <RekaTooltipProvider :delay-duration="props.delayDuration">
    <slot />
  </RekaTooltipProvider>
</template>

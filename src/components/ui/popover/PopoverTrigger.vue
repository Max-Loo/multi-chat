<script setup lang="ts">
/**
 * 气泡卡片触发器（对应旧版 popover.tsx 的 PopoverTrigger）
 */
import { PopoverTrigger, useForwardProps, type PopoverTriggerProps } from 'reka-ui';

const props = defineProps<PopoverTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <PopoverTrigger v-bind="forwarded">
    <slot />
  </PopoverTrigger>
</template>

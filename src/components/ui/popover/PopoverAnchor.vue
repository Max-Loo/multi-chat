<script setup lang="ts">
/**
 * 气泡卡片锚点（对应旧版 popover.tsx 的 PopoverAnchor）
 * 用于内容不跟随触发器时的定位基准
 */
import { PopoverAnchor, useForwardProps, type PopoverAnchorProps } from 'reka-ui';

const props = defineProps<PopoverAnchorProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <PopoverAnchor v-bind="forwarded">
    <slot />
  </PopoverAnchor>
</template>

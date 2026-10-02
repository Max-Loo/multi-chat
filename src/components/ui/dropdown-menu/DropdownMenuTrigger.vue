<script setup lang="ts">
/**
 * 下拉菜单触发器（对应旧版 dropdown-menu.tsx 的 DropdownMenuTrigger）
 */
import {
  DropdownMenuTrigger,
  useForwardProps,
  type DropdownMenuTriggerProps,
} from 'reka-ui';

const props = defineProps<DropdownMenuTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DropdownMenuTrigger v-bind="forwarded">
    <slot />
  </DropdownMenuTrigger>
</template>

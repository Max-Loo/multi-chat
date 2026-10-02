<script setup lang="ts">
/**
 * 下拉菜单传送门（对应旧版 dropdown-menu.tsx 的 DropdownMenuPortal）
 */
import {
  DropdownMenuPortal,
  useForwardProps,
  type DropdownMenuPortalProps,
} from 'reka-ui';

const props = defineProps<DropdownMenuPortalProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DropdownMenuPortal v-bind="forwarded">
    <slot />
  </DropdownMenuPortal>
</template>

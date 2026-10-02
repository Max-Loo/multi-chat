<script setup lang="ts">
/**
 * 下拉菜单分组（对应旧版 dropdown-menu.tsx 的 DropdownMenuGroup）
 */
import { DropdownMenuGroup, useForwardProps, type DropdownMenuGroupProps } from 'reka-ui';

const props = defineProps<DropdownMenuGroupProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DropdownMenuGroup v-bind="forwarded">
    <slot />
  </DropdownMenuGroup>
</template>

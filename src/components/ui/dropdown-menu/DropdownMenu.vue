<script setup lang="ts">
/**
 * 下拉菜单根组件（对应旧版 dropdown-menu.tsx 的 DropdownMenu）
 */
import {
  DropdownMenuRoot,
  useForwardPropsEmits,
  type DropdownMenuRootProps,
  type DropdownMenuRootEmits,
} from 'reka-ui';

const props = defineProps<DropdownMenuRootProps>();
const emits = defineEmits<DropdownMenuRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRoot v-bind="forwarded">
    <slot />
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
/**
 * 下拉菜单子菜单根（对应旧版 dropdown-menu.tsx 的 DropdownMenuSub）
 */
import {
  DropdownMenuSub,
  useForwardPropsEmits,
  type DropdownMenuSubProps,
  type DropdownMenuSubEmits,
} from 'reka-ui';

const props = defineProps<DropdownMenuSubProps>();
const emits = defineEmits<DropdownMenuSubEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuSub v-bind="forwarded">
    <slot />
  </DropdownMenuSub>
</template>

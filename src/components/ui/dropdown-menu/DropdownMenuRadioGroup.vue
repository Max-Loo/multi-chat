<script setup lang="ts">
/**
 * 下拉菜单单选组（对应旧版 dropdown-menu.tsx 的 DropdownMenuRadioGroup）
 */
import {
  DropdownMenuRadioGroup,
  useForwardPropsEmits,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioGroupEmits,
} from 'reka-ui';

const props = defineProps<DropdownMenuRadioGroupProps>();
const emits = defineEmits<DropdownMenuRadioGroupEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DropdownMenuRadioGroup v-bind="forwarded">
    <slot />
  </DropdownMenuRadioGroup>
</template>

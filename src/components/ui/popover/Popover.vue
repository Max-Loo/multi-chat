<script setup lang="ts">
/**
 * 气泡卡片根组件（对应旧版 popover.tsx 的 Popover）
 */
import {
  PopoverRoot,
  useForwardPropsEmits,
  type PopoverRootProps,
  type PopoverRootEmits,
} from 'reka-ui';

const props = defineProps<PopoverRootProps>();
const emits = defineEmits<PopoverRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <PopoverRoot v-bind="forwarded">
    <slot />
  </PopoverRoot>
</template>

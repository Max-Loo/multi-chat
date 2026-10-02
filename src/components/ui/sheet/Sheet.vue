<script setup lang="ts">
/**
 * 侧滑面板根组件（对应旧版 sheet.tsx 的 Sheet）
 * 底层复用 Reka UI Dialog 语义
 */
import {
  DialogRoot,
  useForwardPropsEmits,
  type DialogRootProps,
  type DialogRootEmits,
} from 'reka-ui';

const props = defineProps<DialogRootProps>();
const emits = defineEmits<DialogRootEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <DialogRoot v-bind="forwarded">
    <slot />
  </DialogRoot>
</template>

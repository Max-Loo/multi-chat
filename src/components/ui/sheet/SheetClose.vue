<script setup lang="ts">
/**
 * 侧滑面板关闭按钮（对应旧版 sheet.tsx 的 SheetClose）
 */
import { DialogClose, useForwardProps, type DialogCloseProps } from 'reka-ui';

const props = defineProps<DialogCloseProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogClose v-bind="forwarded">
    <slot />
  </DialogClose>
</template>

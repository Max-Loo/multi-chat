<script setup lang="ts">
/**
 * 对话框关闭按钮组件（对应旧版 dialog.tsx 的 DialogClose）
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

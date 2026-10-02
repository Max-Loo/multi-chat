<script setup lang="ts">
/**
 * 对话框传送门组件（对应旧版 dialog.tsx 的 DialogPortal）
 */
import { DialogPortal, useForwardProps, type DialogPortalProps } from 'reka-ui';

const props = defineProps<DialogPortalProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogPortal v-bind="forwarded">
    <slot />
  </DialogPortal>
</template>

<script setup lang="ts">
/**
 * 对话框触发器组件（对应旧版 dialog.tsx 的 DialogTrigger）
 */
import { DialogTrigger, useForwardProps, type DialogTriggerProps } from 'reka-ui';

const props = defineProps<DialogTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <DialogTrigger v-bind="forwarded">
    <slot />
  </DialogTrigger>
</template>

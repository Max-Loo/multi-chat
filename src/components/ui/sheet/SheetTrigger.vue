<script setup lang="ts">
/**
 * 侧滑面板触发器（对应旧版 sheet.tsx 的 SheetTrigger）
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

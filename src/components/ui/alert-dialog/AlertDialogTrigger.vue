<script setup lang="ts">
/**
 * 确认对话框触发器（对应旧版 alert-dialog.tsx 的 AlertDialogTrigger）
 */
import {
  AlertDialogTrigger,
  useForwardProps,
  type AlertDialogTriggerProps,
} from 'reka-ui';

const props = defineProps<AlertDialogTriggerProps>();
const forwarded = useForwardProps(props);
</script>

<template>
  <AlertDialogTrigger v-bind="forwarded">
    <slot />
  </AlertDialogTrigger>
</template>

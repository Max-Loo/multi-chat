<script setup lang="ts">
/**
 * 确认对话框根组件（对应旧版 alert-dialog.tsx 的 AlertDialog）
 * 与 Dialog 的区别：不支持点击遮罩关闭（强制用户决策）
 */
import {
  AlertDialogRoot,
  useForwardPropsEmits,
  type AlertDialogProps,
  type AlertDialogEmits,
} from 'reka-ui';

const props = defineProps<AlertDialogProps>();
const emits = defineEmits<AlertDialogEmits>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <AlertDialogRoot v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>

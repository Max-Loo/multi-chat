<script setup lang="ts">
/**
 * 全局确认对话框宿主组件（对应旧版 ConfirmProvider 中的对话框部分）
 * 在应用根部渲染一次，配合 useConfirm() 的模块级状态工作
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  confirmDialogState,
  resolveConfirmDialog,
  cancelConfirmDialog,
} from '@/composables/useConfirm';

/** 关闭时视为取消（Esc / 点击遮罩） */
const handleOpenChange = (open: boolean) => {
  if (!open) cancelConfirmDialog();
};
</script>

<template>
  <AlertDialog
    :open="confirmDialogState.isOpen"
    @update:open="handleOpenChange"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmDialogState.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="confirmDialogState.description">
          {{ confirmDialogState.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelConfirmDialog">
          {{ confirmDialogState.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="resolveConfirmDialog">
          {{ confirmDialogState.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

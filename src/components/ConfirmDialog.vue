<script setup lang="ts">
/**
 * 全局确认对话框渲染组件（Vue 版 ConfirmProvider 的渲染部分）
 * 读取 useConfirm 的模块级单例状态，由应用根部挂载一次即可
 */
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle } from '@/components/ui-vue/alert-dialog';
import { useConfirm } from '@/composables/useConfirm';

const { state } = useConfirm();
</script>

<template>
  <!-- 受控模式：开关由按钮回调驱动（确认/取消回调内关闭），AlertDialog 本身不响应外部关闭请求 -->
  <AlertDialog :open="state.isOpen">
    <AlertDialogTitle>{{ state.title }}</AlertDialogTitle>
    <AlertDialogDescription v-if="state.description">
      {{ state.description }}
    </AlertDialogDescription>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <AlertDialogCancel @click="state.onCancel">
        {{ state.cancelText }}
      </AlertDialogCancel>
      <AlertDialogAction @click="state.onConfirm">
        {{ state.confirmText }}
      </AlertDialogAction>
    </div>
  </AlertDialog>
</template>

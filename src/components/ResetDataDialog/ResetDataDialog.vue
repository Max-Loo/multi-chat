<script setup lang="ts">
/**
 * 重置数据确认对话框组件（对应旧版 useResetDataDialog 的 renderResetDialog 部分）
 * 与 useResetDataDialog 组合式函数配合使用
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
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
defineProps<{
  /** 对话框是否打开 */
  open: boolean;
  /** 是否正在重置 */
  isResetting?: boolean;
}>();

const emit = defineEmits<{
  /** 开关状态变化 */
  'update:open': [open: boolean];
  /** 确认重置 */
  confirm: [];
}>();

const { t } = useTranslation();
</script>

<template>
  <AlertDialog
    :open="open"
    @update:open="(value: boolean) => emit('update:open', value)"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t('common.resetConfirmTitle') }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('common.resetConfirmDescription') }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isResetting">
          {{ t('common.cancel') }}
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="isResetting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="emit('confirm')"
        >
          {{ t('common.resetConfirmAction') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

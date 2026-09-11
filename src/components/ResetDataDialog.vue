<script setup lang="ts">
/**
 * 重置数据确认对话框（Vue 版）
 * 与 useResetDataDialog 组合式函数配合使用，行为与 React 版保持一致
 */
import { useTranslation } from '@/composables/useTranslation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
} from '@/components/ui-vue/alert-dialog';

const props = defineProps<{
  open: boolean;
  isResetting?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm'): void;
}>();

const { t } = useTranslation();

const handleCloseRequest = (open: boolean) => {
  if (!open && !props.isResetting) {
    emit('update:open', false);
  }
};

const handleConfirm = () => {
  if (!props.isResetting) {
    emit('confirm');
  }
};
</script>

<template>
  <AlertDialog :open="props.open" @update:open="handleCloseRequest">
    <AlertDialogTitle>{{ t(($) => $.common.resetConfirmTitle) }}</AlertDialogTitle>
    <AlertDialogDescription>
      {{ t(($) => $.common.resetConfirmDescription) }}
    </AlertDialogDescription>
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <AlertDialogCancel :disabled="props.isResetting">
        {{ t(($) => $.common.cancel) }}
      </AlertDialogCancel>
      <AlertDialogAction
        :disabled="props.isResetting"
        class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        @click="handleConfirm"
      >
        {{ t(($) => $.common.resetConfirmAction) }}
      </AlertDialogAction>
    </div>
  </AlertDialog>
</template>

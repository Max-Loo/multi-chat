<script setup lang="ts">
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { resetAllData } from '@/utils/resetAllData';
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

/**
 * 重置数据确认对话框
 *
 * 封装重置确认流程（转写自 React hooks/useResetDataDialog 的对话框部分），
 * 供致命错误屏幕与密钥管理页共用；确认后重置数据并刷新页面
 */
const open = defineModel<boolean>('open', { required: true });

const { t } = useTranslation();

/** 是否正在重置 */
const isResetting = ref(false);

/**
 * 确认重置：执行数据重置并刷新页面
 */
async function handleConfirmReset(): Promise<void> {
  isResetting.value = true;
  try {
    await resetAllData();
    window.location.reload();
  } catch (error) {
    console.error('重置数据失败:', error);
    isResetting.value = false;
    open.value = false;
  }
}
</script>

<template>
  <AlertDialog v-model:open="open">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t('common.resetConfirmTitle') }}
        </AlertDialogTitle>
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
          @click="handleConfirmReset"
        >
          {{ t('common.resetConfirmAction') }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

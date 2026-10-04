<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
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
  confirmState,
  confirmOk,
  confirmCancel,
} from '@/composables/useConfirm';

/**
 * 全局确认对话框宿主
 *
 * 渲染 useConfirm 的共享状态对应的对话框，需挂载在应用根部
 */
const { t } = useTranslation();
</script>

<template>
  <AlertDialog
    :open="confirmState.isOpen"
    @update:open="(open: boolean) => { if (!open) confirmCancel(); }"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ confirmState.title || t('common.confirm') }}</AlertDialogTitle>
        <AlertDialogDescription v-if="confirmState.description">
          {{ confirmState.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="confirmCancel">
          {{ confirmState.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="confirmOk">
          {{ confirmState.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

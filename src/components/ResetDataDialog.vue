<script setup lang="ts">
import { useT } from "@/composables/useT";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * 重置数据确认对话框组件
 * 配合 composables/useResetDataDialog 使用
 */
interface Props {
  /** 对话框是否打开 */
  open: boolean;
  /** 重置进行中标志（控制按钮禁用） */
  isResetting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isResetting: false,
});

const emit = defineEmits<{
  /** 对话框开关状态变更 */
  "update:open": [open: boolean];
  /** 点击确认重置 */
  confirm: [];
}>();

const t = useT();
</script>

<template>
  <AlertDialog
    :open="props.open"
    @update:open="(open: boolean) => emit('update:open', open)"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t(($) => $.common.resetConfirmTitle) }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ t(($) => $.common.resetConfirmDescription) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="props.isResetting">
          {{ t(($) => $.common.cancel) }}
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="props.isResetting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          @click="emit('confirm')"
        >
          {{ t(($) => $.common.resetConfirmAction) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

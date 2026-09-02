<script setup lang="ts">
/**
 * 全局确认对话框 Provider 组件（对应原 hooks/useConfirm.tsx 的 ConfirmProvider）
 *
 * 使用 provide/inject 替代 React Context：
 * - 根组件放置一次 `<ConfirmProvider />`
 * - 任意后代组件通过 `useConfirm()` 获取 `modal.confirm / modal.warning`
 */
import { provide, reactive } from "vue";
import { useT } from "@/composables/useT";
import {
  ConfirmProviderKey,
  type ConfirmOptions,
  type ConfirmContextValue,
} from "@/composables/confirmContext";
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

const t = useT();

/** 对话框内部状态 */
const state = reactive({
  isOpen: false,
  title: "",
  description: "",
  onConfirm: () => {},
  onCancel: () => {},
  confirmText: "",
  cancelText: "",
});

/**
 * 打开确认对话框
 */
function showConfirm(props: ConfirmOptions): void {
  state.isOpen = true;
  state.title = props.title || t(($) => $.common.confirm);
  state.description = props.description || props.content || "";
  state.onConfirm = () => {
    props.onOk?.();
    state.isOpen = false;
  };
  state.onCancel = () => {
    props.onCancel?.();
    state.isOpen = false;
  };
  state.confirmText = props.okText || t(($) => $.common.confirm);
  state.cancelText = props.cancelText || t(($) => $.common.cancel);
}

// 向后代组件提供 showConfirm 能力
provide(ConfirmProviderKey, { showConfirm } as ConfirmContextValue);
</script>

<template>
  <AlertDialog
    :open="state.isOpen"
    @update:open="(open: boolean) => { if (!open) state.onCancel(); }"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ state.title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="state.description">
          {{ state.description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="state.onCancel()">
          {{ state.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction @click="state.onConfirm()">
          {{ state.confirmText }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

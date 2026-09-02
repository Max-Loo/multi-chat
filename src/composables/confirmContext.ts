/**
 * 确认对话框共享上下文定义
 * 供 ConfirmProvider.vue（provide）与 composables/useConfirm.ts（inject）共用，
 * 避免循环引用
 */
import type { InjectionKey } from "vue";

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  title?: string;
  description?: string;
  content?: string;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
}

/**
 * 确认对话框注入上下文
 */
export interface ConfirmContextValue {
  showConfirm: (props: ConfirmOptions) => void;
}

/** provide/inject 注入键（单一事实来源） */
export const ConfirmProviderKey: InjectionKey<ConfirmContextValue> =
  Symbol("ConfirmProvider");

/**
 * 全局确认对话框组合式函数（转写自 React hooks/useConfirm）
 *
 * 状态为模块级共享：任意组件调用 showConfirm 后，由应用根部的
 * ConfirmHost 负责渲染对话框。替代 ant-design 的 App.useApp().modal。
 */
import { reactive } from 'vue';
import { tSafely } from '@/services/i18n';

/** 确认对话框选项 */
export interface ConfirmOptions {
  /** 对话框标题，缺省使用 common.confirm */
  title?: string;
  /** 对话框描述文本 */
  description?: string;
  /** 对话框正文（与 description 等价，保留旧调用方兼容） */
  content?: string;
  /** 确认回调 */
  onOk?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 确认按钮文本，缺省使用 common.confirm */
  okText?: string;
  /** 取消按钮文本，缺省使用 common.cancel */
  cancelText?: string;
}

/** 对话框内部状态 */
interface ConfirmState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
}

/** 模块级共享的对话框状态（由 ConfirmHost 渲染） */
const state = reactive({
  isOpen: false,
  title: '',
  description: '',
  confirmText: '',
  cancelText: '',
});

/** 当前对话框的回调（不放进 reactive，避免函数被代理） */
let pendingOnOk: (() => void) | undefined;
let pendingOnCancel: (() => void) | undefined;

/**
 * 展示确认对话框
 * @param props 对话框选项
 */
export function showConfirm(props: ConfirmOptions): void {
  pendingOnOk = props.onOk;
  pendingOnCancel = props.onCancel;
  state.title = props.title || tSafely('common.confirm', '确认');
  state.description = props.description || props.content || '';
  state.confirmText = props.okText || tSafely('common.confirm', '确认');
  state.cancelText = props.cancelText || tSafely('common.cancel', '取消');
  state.isOpen = true;
}

/**
 * 用户点击确认
 */
export function confirmOk(): void {
  pendingOnOk?.();
  state.isOpen = false;
}

/**
 * 用户点击取消或关闭对话框
 */
export function confirmCancel(): void {
  pendingOnCancel?.();
  state.isOpen = false;
}

/**
 * 全局确认对话框组合式函数
 * @returns modal.confirm / modal.warning 与 React 版调用方式一致
 */
export function useConfirm() {
  return {
    modal: {
      confirm: (props: ConfirmOptions) => showConfirm(props),
      warning: (props: ConfirmOptions) =>
        showConfirm({ ...props, title: props.title || '警告' }),
    },
  };
}

/** 供 ConfirmHost 读取的共享状态（只读视图由组件自行按需使用） */
export const confirmState = state as Readonly<ConfirmState>;

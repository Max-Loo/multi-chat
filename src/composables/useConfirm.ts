/**
 * 全局确认对话框组合式函数（对应旧版 hooks/useConfirm.tsx）
 *
 * 采用模块级响应式状态替代 React Context：任意组件调用 useConfirm() 弹出确认框，
 * 根组件渲染一次 <ConfirmDialogHost /> 承载 AlertDialog。
 */
import { reactive } from 'vue';
import { useTranslation } from '@/composables/useTranslation';

/** 确认框选项 */
export interface ConfirmOptions {
  /** 标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 内容文本（与 description 等价的旧版别名） */
  content?: string;
  /** 确认回调 */
  onOk?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 确认按钮文案 */
  okText?: string;
  /** 取消按钮文案 */
  cancelText?: string;
}

/** 宿主组件读取的模块级状态 */
export const confirmDialogState = reactive({
  isOpen: false,
  title: '',
  description: '',
  confirmText: '',
  cancelText: '',
});

// 模块级回调（不放进 reactive，避免被代理）
let pendingOnConfirm: (() => void) | null = null;
let pendingOnCancel: (() => void) | null = null;

/** 宿主组件内部调用：确认 */
export function resolveConfirmDialog(): void {
  pendingOnConfirm?.();
  confirmDialogState.isOpen = false;
  pendingOnConfirm = null;
  pendingOnCancel = null;
}

/** 宿主组件内部调用：取消 */
export function cancelConfirmDialog(): void {
  pendingOnCancel?.();
  confirmDialogState.isOpen = false;
  pendingOnConfirm = null;
  pendingOnCancel = null;
}

/**
 * 全局确认对话框 Hook
 * 用于替代 ant-design 的 App.useApp().modal
 *
 * @example
 * ```ts
 * const { modal } = useConfirm();
 * modal.warning({
 *   title: '确认删除？',
 *   description: '此操作无法撤销',
 *   onOk: () => console.log('已删除'),
 * });
 * ```
 */
export const useConfirm = () => {
  const { t } = useTranslation();

  /** 弹出确认框 */
  const showConfirm = (props: ConfirmOptions): void => {
    pendingOnConfirm = props.onOk ?? null;
    pendingOnCancel = props.onCancel ?? null;
    confirmDialogState.title = props.title || t('common.confirm');
    confirmDialogState.description =
      props.description || props.content || '';
    confirmDialogState.confirmText = props.okText || t('common.confirm');
    confirmDialogState.cancelText = props.cancelText || t('common.cancel');
    confirmDialogState.isOpen = true;
  };

  return {
    modal: {
      /** 普通确认框 */
      confirm: (props: ConfirmOptions) => showConfirm(props),
      /** 警告确认框（与 confirm 行为一致，语义区分） */
      warning: (props: ConfirmOptions) =>
        showConfirm({ ...props, title: props.title || t('common.confirm') }),
    },
  };
};

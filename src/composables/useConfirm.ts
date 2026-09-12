import { reactive } from 'vue';
import { useTranslation } from './useTranslation';

/**
 * 确认对话框选项
 */
export interface ConfirmOptions {
  /** 对话框标题 */
  title?: string;
  /** 对话框描述 */
  description?: string;
  /** 对话框内容（作为描述的别名，兼容 ant-design modal 用法） */
  content?: string;
  /** 确认回调 */
  onOk?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 确认按钮文本 */
  okText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
}

/**
 * 确认对话框内部状态
 */
interface ConfirmState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 全局确认对话框状态（模块级单例）
 * Vue 版无需 Provider 装配：状态即模块级响应式单例，
 * 渲染由 ConfirmDialog.vue 组件承担（使用方在根部挂载一次）
 */
const state = reactive<ConfirmState>({
  isOpen: false,
  title: '',
  description: '',
  confirmText: '',
  cancelText: '',
  onConfirm: () => {},
  onCancel: () => {},
});

/** 打开确认对话框（默认标题/按钮文案走 i18n） */
const showConfirm = (props: ConfirmOptions): void => {
  const { t } = useTranslation();

  state.isOpen = true;
  state.title = props.title || t(($) => $.common.confirm);
  state.description = props.description || props.content || '';
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
};

/**
 * 全局确认对话框组合式函数（Vue 版 useConfirm）
 * 用于替代 ant-design 的 App.useApp().modal，与 React 版 API 形态保持一致
 *
 * @example
 * ```ts
 * const { modal } = useConfirm();
 * modal.confirm({
 *   title: '确认删除？',
 *   description: '此操作无法撤销',
 *   onOk: () => console.log('已删除'),
 * });
 * ```
 */
export const useConfirm = () => {
  return {
    /** 对话框状态（供 ConfirmDialog.vue 渲染） */
    state,
    /** modal 风格 API（与 React 版一致） */
    modal: {
      confirm: (props: ConfirmOptions) => showConfirm(props),
      warning: (props: ConfirmOptions) => showConfirm({ ...props, title: props.title || '警告' }),
    },
  };
};

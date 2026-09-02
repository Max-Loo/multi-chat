/**
 * 全局确认对话框 Hook（对应原 hooks/useConfirm.tsx 的 useConfirm）
 * 需在根组件中放置 `<ConfirmProvider />` 后使用
 */
import { inject } from "vue";
import {
  ConfirmProviderKey,
  type ConfirmOptions,
} from "@/composables/confirmContext";

export type { ConfirmOptions };

/**
 * 全局确认对话框 Hook
 *
 * @example
 * const { modal } = useConfirm();
 * modal.confirm({
 *   title: '确认删除？',
 *   description: '此操作无法撤销',
 *   onOk: () => console.log('已删除'),
 * });
 */
export function useConfirm() {
  const context = inject(ConfirmProviderKey);

  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }

  return {
    modal: {
      confirm: (props: ConfirmOptions) => context.showConfirm(props),
      warning: (props: ConfirmOptions) =>
        context.showConfirm({ ...props, title: props.title || "警告" }),
    },
  };
}

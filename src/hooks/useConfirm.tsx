import React, { createContext, useContext, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

interface ConfirmOptions {
  title?: string;
  description?: string;
  content?: string;
  onOk?: () => void;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
}

interface ConfirmContextValue {
  showConfirm: (props: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

/**
 * 全局确认对话框 Provider
 * 应在应用的根组件中包裹
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();

  const [state, setState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText: string;
    cancelText: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: t($ => $.common.confirm),
    cancelText: t($ => $.common.cancel),
  });

  const showConfirm = useCallback((props: ConfirmOptions) => {
    setState({
      isOpen: true,
      title: props.title || t($ => $.common.confirm),
      description: props.description || props.content || '',
      onConfirm: () => {
        props.onOk?.();
        setState((prev) => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        props.onCancel?.();
        setState((prev) => ({ ...prev, isOpen: false }));
      },
    confirmText: props.okText || t($ => $.common.confirm),
    cancelText: props.cancelText || t($ => $.common.cancel),
  });
  }, [t]);

  const contextValue: ConfirmContextValue = { showConfirm };

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}
      <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && state.onCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{state.title}</AlertDialogTitle>
            {state.description && (
              <AlertDialogDescription>{state.description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={state.onCancel}>{state.cancelText}</AlertDialogCancel>
            <AlertDialogAction onClick={state.onConfirm}>{state.confirmText}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
};

/**
 * 全局确认对话框 Hook
 * 用于替代 ant-design 的 App.useApp().modal
 *
 * @example
 * const { modal } = useConfirm();
 * modal.confirm({
 *   title: '确认删除？',
 *   description: '此操作无法撤销',
 *   onOk: () => console.log('已删除'),
 * });
 */
export const useConfirm = () => {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider');
  }

  return {
    modal: {
      confirm: (props: ConfirmOptions) => context.showConfirm(props),
      warning: (props: ConfirmOptions) => context.showConfirm({ ...props, title: props.title || '警告' }),
    },
  };
};

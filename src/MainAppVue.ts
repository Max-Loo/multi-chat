/**
 * 主应用工厂（Vue 版）
 *
 * 包含路由视图与初始化结果相关的副作用（静默刷新、安全警告、警告/解密失败 Toast），
 * 通过工厂函数接收初始化结果，行为与 迁移前 MainApp 保持一致。
 * KeyRecoveryDialog 的完整迁移属于任务 4.5（密钥管理界面），当前先接入解密失败 Toast。
 */
import { defineAsyncComponent } from 'vue';
import { toastQueue } from '@/services/toast';
import { handleSecurityWarning } from '@/store/keyring/masterKey';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { useTranslation } from '@/composables/useTranslation';
import type { InitResult } from '@/services/initialization';

/**
 * 创建主应用组件的工厂函数
 * @param result 初始化结果
 * @returns 主应用 Vue 组件定义
 */
export function createMainApp(result: InitResult) {
  return defineAsyncComponent(async () => {
    const { defineComponent, onMounted, ref, h } = await import('vue');
    const { RouterView } = await import('vue-router');

    const component = defineComponent({
      setup() {
        const { t } = useTranslation();
        const notified = ref(false);

        // 静默刷新模型供应商数据（原 useEffect 逻辑）
        onMounted(() => {
          const modelProviderStore = useModelProviderStore();
          modelProviderStore.triggerSilentRefreshIfNeeded();

          // 安全警告提示
          void handleSecurityWarning();

          // 初始化警告 Toast
          if (result.warnings.length > 0) {
            result.warnings.forEach((warning) => {
              toastQueue.warning(warning.message, {
                description: import.meta.env.DEV
                  ? String(warning.originalError)
                  : undefined,
              });
            });
          }

          // 解密失败通知（优先于密钥重新生成通知）
          // TODO(任务 4.5): KeyRecoveryDialog.vue 迁移完成后，恢复"打开密钥恢复对话框"的动作
          if (result.decryptionFailureCount && result.decryptionFailureCount > 0 && !notified.value) {
            notified.value = true;
            toastQueue.warning(
              t(($) => $.common.decryptionFailureMessage, { count: result.decryptionFailureCount }),
              {
                duration: Infinity,
                action: {
                  label: t(($) => $.common.decryptionFailureImport),
                  onClick: () => {
                    // 占位：任务 4.5 接入 KeyRecoveryDialog 后打开对话框
                  },
                },
                cancel: {
                  label: t(($) => $.common.decryptionFailureDismiss),
                  onClick: () => {},
                },
              },
            );
          }
        });

        return { t };
      },
      // 渲染路由视图（运行时无模板编译器，使用 render 函数）
      render: () => h(RouterView),
    });

    return component;
  });
}

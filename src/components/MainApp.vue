<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import ToasterWrapper from '@/services/toast/ToasterWrapper.vue';
import { toastQueue } from '@/services/toast';
import { handleSecurityWarning } from '@/store/keyring/masterKey';
import { useModelProviderStore } from '@/store/modelProvider';
import ConfirmHost from '@/components/ConfirmHost.vue';
import { KeyRecoveryDialog } from '@/components/KeyRecoveryDialog';
import type { InitResult } from '@/services/initialization';

/**
 * 主应用外壳属性
 */
interface MainAppProps {
  /** 初始化结果（用于展示警告与解密失败提示） */
  result: InitResult;
}

const props = defineProps<MainAppProps>();

const { t } = useTranslation();

/** 密钥恢复对话框打开状态（解密失败提示的动作入口） */
const isRecoveryDialogOpen = ref(false);

/** 解密失败通知只展示一次 */
let decryptionFailureNotified = false;

onMounted(() => {
  // 后台静默刷新模型供应商数据
  useModelProviderStore().triggerSilentRefreshIfNeeded();

  // 安全性警告（引导导出主密钥备份）
  void handleSecurityWarning();

  // 初始化警告以 Toast 告知（非关键步骤失败不阻塞进入主界面）
  if (props.result.warnings.length > 0) {
    props.result.warnings.forEach((warning) => {
      toastQueue.warning(warning.message, {
        description: import.meta.env.DEV
          ? String(warning.originalError)
          : undefined,
      });
    });
  }

  // 解密失败通知（含导入密钥动作，常驻展示）
  if (
    !decryptionFailureNotified &&
    props.result.decryptionFailureCount &&
    props.result.decryptionFailureCount > 0
  ) {
    decryptionFailureNotified = true;
    toastQueue.warning(
      t('common.decryptionFailureMessage', {
        count: props.result.decryptionFailureCount,
      }),
      {
        duration: Infinity,
        action: {
          label: t('common.decryptionFailureImport'),
          onClick: () => {
            isRecoveryDialogOpen.value = true;
          },
        },
        cancel: {
          label: t('common.decryptionFailureDismiss'),
          onClick: () => {},
        },
      },
    );
  }
});
</script>

<!--
  主应用外壳
  包含路由视图、Toast 渲染器、全局确认对话框与密钥恢复入口
-->
<template>
  <RouterView />
  <ToasterWrapper />
  <ConfirmHost />
  <KeyRecoveryDialog
    v-model:open="isRecoveryDialogOpen"
  />
</template>

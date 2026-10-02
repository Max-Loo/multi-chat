<script setup lang="ts">
/**
 * 主应用组件（对应旧版 MainApp.tsx）
 *
 * 包含重型依赖（Pinia stores、Router、Toast 等），通过 defineAsyncComponent 按需加载。
 * 承载：静默刷新触发、安全警告、初始化警告 Toast、解密失败恢复入口。
 */
import { onMounted, ref } from 'vue';
import { RouterView } from 'vue-router';
import router from '@/router';
import { ConfirmDialogHost } from '@/components/ConfirmDialogHost';
import ToasterWrapper from '@/services/toast/ToasterWrapper.vue';
import { handleSecurityWarning } from '@/store/keyring/masterKey';
import { useModelProviderStore } from '@/stores';
import { toastQueue } from '@/services/toast';
import type { InitResult } from '@/services/initialization';
import { useTranslation } from '@/composables/useTranslation';
import KeyRecoveryDialog from '@/components/KeyRecoveryDialog/KeyRecoveryDialog.vue';

/** 初始化结果（由 App 传入） */
const props = defineProps<{ result: InitResult }>();

const { t } = useTranslation();
const modelProviderStore = useModelProviderStore();
const isRecoveryDialogOpen = ref(false);

let notified = false;

onMounted(() => {
  // 触发供应商后台静默刷新（如无进行中的刷新）
  if (!modelProviderStore.backgroundRefreshing) {
    void modelProviderStore.silentRefreshModelProvider();
  }

  // 处理安全警告
  void handleSecurityWarning();

  // 初始化警告 Toast
  props.result.warnings.forEach((warning) => {
    void toastQueue.warning(warning.message, {
      description: import.meta.env.DEV
        ? String(warning.originalError)
        : undefined,
    });
  });

  // 解密失败通知（优先于密钥重新生成通知，仅通知一次）
  if (!notified && props.result.decryptionFailureCount && props.result.decryptionFailureCount > 0) {
    notified = true;
    void toastQueue.warning(
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

  // 挂载后安装路由（与旧版 RouterProvider 语义对齐）
  void router.isReady();
});
</script>

<template>
  <RouterView />
  <ToasterWrapper />
  <ConfirmDialogHost />
  <KeyRecoveryDialog
    :open="isRecoveryDialogOpen"
    @update:open="isRecoveryDialogOpen = $event"
  />
</template>

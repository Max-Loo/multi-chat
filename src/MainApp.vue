<script setup lang="ts">
import { onMounted, ref } from "vue";
import { RouterView } from "vue-router";
import ConfirmProvider from "@/components/ConfirmProvider.vue";
import ToasterWrapper from "@/services/toast/ToasterWrapper.vue";
import { handleSecurityWarning } from "@/store/keyring/masterKey";
import { useModelProviderStore } from "@/store/stores/modelProvider";
import { toastQueue } from "@/services/toast";
import { useT } from "@/composables/useT";
import { KeyRecoveryDialog } from "@/components/KeyRecoveryDialog";
import type { InitResult } from "@/services/initialization";

/**
 * 主应用组件
 *
 * 包含重型依赖（Pinia stores、Router、Toast 等），通过动态导入实现按需加载
 */

/**
 * 主应用属性
 */
interface Props {
  /** 初始化结果（由 createMainApp 工厂注入） */
  result: InitResult;
}

const props = defineProps<Props>();

const t = useT();
const modelProviderStore = useModelProviderStore();
const isRecoveryDialogOpen = ref(false);
// 通知只发一次的标记
let notified = false;

onMounted(() => {
  // 静默刷新模型供应商数据
  modelProviderStore.triggerSilentRefreshIfNeeded();

  // 安全警告处理
  handleSecurityWarning();

  // 初始化警告 Toast
  if (props.result.warnings.length > 0) {
    props.result.warnings.forEach((warning) => {
      toastQueue.warning(warning.message, {
        description: import.meta.env.DEV
          ? String(warning.originalError)
          : undefined,
      });
    });
  }

  // 解密失败通知（优先于密钥重新生成通知）
  if (
    !notified &&
    props.result.decryptionFailureCount &&
    props.result.decryptionFailureCount > 0
  ) {
    notified = true;
    toastQueue.warning(
      t(($) => $.common.decryptionFailureMessage, {
        count: props.result.decryptionFailureCount,
      }),
      {
        duration: Infinity,
        action: {
          label: t(($) => $.common.decryptionFailureImport),
          onClick: () => {
            isRecoveryDialogOpen.value = true;
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
</script>

<template>
  <ConfirmProvider />
  <RouterView />
  <ToasterWrapper />
  <KeyRecoveryDialog
    :open="isRecoveryDialogOpen"
    @update:open="isRecoveryDialogOpen = $event"
  />
</template>

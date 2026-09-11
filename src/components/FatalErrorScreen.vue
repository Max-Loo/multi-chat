<script setup lang="ts">
/**
 * 致命错误屏幕组件（Vue 版）
 * 显示初始化过程中的致命错误和恢复选项，行为与 React 版保持一致
 */
import { computed, ref } from 'vue';
import { AlertOctagon } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui-vue/alert';
import { useTranslation } from '@/composables/useTranslation';
import { STEP_NAMES } from '@/config/initSteps';
import { useResetDataDialog } from '@/composables/useResetDataDialog';
import ResetDataDialog from '@/components/ResetDataDialog.vue';
import KeyRecoveryDialog from '@/components/KeyRecoveryDialog.vue';
import type { InitError } from '@/services/initialization';

const props = defineProps<{ errors: InitError[] }>();

const { t } = useTranslation();
const { isDialogOpen, setIsDialogOpen, isResetting } = useResetDataDialog();
const isRecoveryDialogOpen = ref(false);

/** 处理刷新页面 */
const handleRefresh = () => {
  window.location.reload();
};

/** 检测是否有 masterKey 步骤的 fatal 错误 */
const hasMasterKeyError = computed(() =>
  props.errors.some((error) => error.stepName === STEP_NAMES.masterKey),
);

/** 格式化错误详情为可读字符串 */
const formatErrorDetails = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return JSON.stringify(error, null, 2);
};

/** 打开密钥恢复对话框 */
const openRecoveryDialog = () => {
  isRecoveryDialogOpen.value = true;
};

/** 是否显示错误详情（仅开发模式且有原始错误时） */
const shouldShowErrorDetails = (error: InitError): boolean => {
  return import.meta.env.DEV && error.originalError != null;
};
</script>

<template>
  <div data-testid="fatal-error-screen" class="fixed inset-0 flex items-center justify-center bg-background p-4">
    <div class="flex max-w-2xl flex-col gap-6">
      <!-- 错误图标和标题 -->
      <div class="flex flex-col items-center gap-4 text-center">
        <AlertOctagon class="h-16 w-16 text-destructive" />
        <h1 class="text-2xl font-semibold">
          {{ t(($) => $.common.initializationFailed) }}
        </h1>
        <p class="text-muted-foreground">
          {{ t(($) => $.common.initializationFailedDescription) }}
        </p>
      </div>

      <!-- 错误列表 -->
      <div class="flex flex-col gap-3">
        <Alert v-for="(error, index) in props.errors" :key="index" variant="destructive" class="p-4">
          <AlertOctagon class="h-4 w-4" />
          <AlertTitle>{{ error.message }}</AlertTitle>
          <AlertDescription class="mt-1">
            <!-- 开发模式下显示错误详情 -->
            <details v-if="shouldShowErrorDetails(error)" class="mt-2">
              <summary class="cursor-pointer text-sm font-medium">
                {{ t(($) => $.common.showErrorDetails) }}
              </summary>
              <pre class="mt-2 max-h-48 overflow-auto text-xs">{{ formatErrorDetails(error.originalError) }}</pre>
            </details>
          </AlertDescription>
        </Alert>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col items-center gap-3">
        <Button :disabled="isResetting" size="lg" @click="handleRefresh">
          {{ t(($) => $.common.refreshPage) }}
        </Button>
        <div class="w-full border-t" />
        <div class="flex flex-row flex-wrap items-center justify-center gap-3">
          <Button
            v-if="hasMasterKeyError"
            variant="outline"
            size="lg"
            :disabled="isResetting"
            @click="openRecoveryDialog"
          >
            {{ t(($) => $.common.masterKeyRegeneratedImport) }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            :disabled="isResetting"
            @click="setIsDialogOpen(true)"
          >
            {{ t(($) => $.common.resetAllData) }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <ResetDataDialog
      :open="isDialogOpen"
      :is-resetting="isResetting"
      @update:open="setIsDialogOpen"
    />

    <!-- 密钥恢复对话框 -->
    <KeyRecoveryDialog
      :open="isRecoveryDialogOpen"
      @update:open="isRecoveryDialogOpen = $event"
    />
  </div>
</template>

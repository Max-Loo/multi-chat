<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { AlertOctagon } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { STEP_NAMES } from '@/config/initSteps';
import { KeyRecoveryDialog } from '@/components/KeyRecoveryDialog';
import ResetDataDialog from '@/components/ResetDataDialog.vue';
import type { InitError } from '@/services/initialization';

/**
 * 致命错误屏幕组件属性
 */
interface FatalErrorScreenProps {
  /** 错误列表 */
  errors: InitError[];
}

const props = defineProps<FatalErrorScreenProps>();

const { t } = useTranslation();

/** 重置数据对话框打开状态 */
const isResetDialogOpen = ref(false);
/** 密钥恢复对话框打开状态 */
const isRecoveryDialogOpen = ref(false);

/** 是否正在重置（重置对话框确认后立即触发刷新，此处仅为按钮禁用占位） */
const isResetting = ref(false);

/** 是否为开发模式（模板内不能直接访问 import.meta） */
const isDev = import.meta.env.DEV;

/** 是否存在主密钥步骤的致命错误（决定是否展示密钥恢复入口） */
const hasMasterKeyError = computed(() =>
  props.errors.some((error) => error.stepName === STEP_NAMES.masterKey),
);

/** 处理刷新页面 */
const handleRefresh = () => {
  window.location.reload();
};

/**
 * 格式化错误详情为可读字符串
 * @param error 原始错误对象
 */
function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return JSON.stringify(error, null, 2);
}
</script>

<!-- 致命错误屏幕：显示初始化过程中的致命错误和恢复选项 -->
<template>
  <div class="fixed inset-0 flex items-center justify-center bg-background p-4">
    <div class="flex max-w-2xl flex-col gap-6">
      <!-- 错误图标和标题 -->
      <div class="flex flex-col items-center text-center gap-4">
        <AlertOctagon class="h-16 w-16 text-destructive" />
        <h1 class="text-2xl font-semibold">
          {{ t('common.initializationFailed') }}
        </h1>
        <p class="text-muted-foreground">
          {{ t('common.initializationFailedDescription') }}
        </p>
      </div>

      <!-- 错误列表 -->
      <div class="flex flex-col gap-3">
        <Alert
          v-for="(error, index) in props.errors"
          :key="index"
          variant="destructive"
          class="p-4"
        >
          <AlertOctagon class="h-4 w-4" />
          <AlertTitle>{{ error.message }}</AlertTitle>
          <AlertDescription class="mt-1">
            <!-- 开发模式下显示错误详情 -->
            <details v-if="isDev && error.originalError != null" class="mt-2">
              <summary class="cursor-pointer text-sm font-medium">
                {{ t('common.showErrorDetails') }}
              </summary>
              <pre class="mt-2 text-xs overflow-auto max-h-48">{{
                formatErrorDetails(error.originalError)
              }}</pre>
            </details>
          </AlertDescription>
        </Alert>
      </div>

      <!-- 操作按钮 -->
      <div class="flex flex-col items-center gap-3">
        <Button size="lg" :disabled="isResetting" @click="handleRefresh">
          {{ t('common.refreshPage') }}
        </Button>
        <div class="w-full border-t" />
        <div class="flex flex-row flex-wrap items-center justify-center gap-3">
          <Button
            v-if="hasMasterKeyError"
            variant="outline"
            size="lg"
            :disabled="isResetting"
            @click="isRecoveryDialogOpen = true"
          >
            {{ t('common.masterKeyRegeneratedImport') }}
          </Button>
          <Button
            variant="outline"
            size="lg"
            :disabled="isResetting"
            @click="isResetDialogOpen = true"
          >
            {{ t('common.resetAllData') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 重置确认对话框 -->
    <ResetDataDialog v-model:open="isResetDialogOpen" />

    <!-- 密钥恢复对话框 -->
    <KeyRecoveryDialog
      :open="isRecoveryDialogOpen"
      @update:open="(value: boolean) => (isRecoveryDialogOpen = value)"
    />
  </div>
</template>

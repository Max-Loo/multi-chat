<script setup lang="ts">
import { ref } from "vue"
import { AlertOctagon } from "@lucide/vue"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useT } from "@/composables/useT"
import { useResetDataDialog } from "@/composables/useResetDataDialog"
import ResetDataDialog from "@/components/ResetDataDialog.vue"
import { KeyRecoveryDialog } from "@/components/KeyRecoveryDialog"
import { STEP_NAMES } from "@/config/initSteps"
import type { InitError } from "@/services/initialization"

/**
 * 致命错误屏幕组件
 * 显示初始化过程中的致命错误和恢复选项
 */
interface Props {
  /** 错误列表 */
  errors: InitError[]
}

const props = defineProps<Props>()

const t = useT()
const {
  isDialogOpen,
  setIsDialogOpen,
  isResetting,
  handleConfirmReset,
} = useResetDataDialog()
const isRecoveryDialogOpen = ref(false)

/**
 * 检测是否有 masterKey 步骤的 fatal 错误
 */
const hasMasterKeyError = props.errors.some(
  (error) => error.stepName === STEP_NAMES.masterKey,
)

/**
 * 处理刷新页面
 */
function handleRefresh(): void {
  window.location.reload()
}

/**
 * 判断是否显示错误详情（仅开发模式且存在原始错误）
 */
function shouldShowErrorDetails(error: InitError): boolean {
  return import.meta.env.DEV && error.originalError != null;
}

/**
 * 格式化错误详情为可读字符串
 */
function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }
  return JSON.stringify(error, null, 2);
}
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-background p-4">
    <div class="flex max-w-2xl flex-col gap-6">
      <!-- 错误图标和标题 -->
      <div class="flex flex-col items-center text-center gap-4">
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
            <details v-if="shouldShowErrorDetails(error)" class="mt-2">
              <summary class="cursor-pointer text-sm font-medium">
                {{ t(($) => $.common.showErrorDetails) }}
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
          {{ t(($) => $.common.refreshPage) }}
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
      @confirm="handleConfirmReset"
    />

    <!-- 密钥恢复对话框 -->
    <KeyRecoveryDialog
      :open="isRecoveryDialogOpen"
      @update:open="isRecoveryDialogOpen = $event"
    />
  </div>
</template>

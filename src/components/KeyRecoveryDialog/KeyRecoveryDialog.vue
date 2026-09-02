<script setup lang="ts">
import { ref } from "vue"
import { useT } from "@/composables/useT"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { importMasterKeyWithValidation } from "@/store/keyring/masterKey"
import { toastQueue } from "@/services/toast"
import { AlertTriangle, Loader2 } from "@lucide/vue"

/**
 * 密钥恢复对话框组件
 * 供 FatalErrorScreen 和 Toast 恢复流程共用
 */
interface Props {
  /** 对话框是否打开 */
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** 对话框开关状态变更 */
  "update:open": [open: boolean]
}>()

const t = useT()

/** 对话框状态 */
type DialogState = "input" | "importing" | "mismatch" | "error"

const keyInput = ref("")
const state = ref<DialogState>("input")
const errorMessage = ref("")

/**
 * 关闭对话框并重置状态（导入中不允许关闭）
 */
function handleClose(): void {
  if (state.value !== "importing") {
    state.value = "input"
    keyInput.value = ""
    errorMessage.value = ""
    emit("update:open", false)
  }
}

/**
 * 导入主密钥
 * @param force 是否强制导入（密钥不匹配时覆盖）
 */
async function handleImport(force = false): Promise<void> {
  const trimmedKey = keyInput.value.trim()
  if (!trimmedKey) return

  state.value = "importing"

  try {
    const result = await importMasterKeyWithValidation(trimmedKey, force)

    if (result.success) {
      toastQueue.success(t(($) => $.common.keyRecovery.importSuccess))
      emit("update:open", false)
      window.location.reload()
      return
    }

    if (result.keyMatched === false) {
      state.value = "mismatch"
      return
    }

    state.value = "error"
    errorMessage.value =
      result.error || t(($) => $.common.keyRecovery.mismatchWarning)
  } catch {
    state.value = "error"
    errorMessage.value = t(($) => $.common.keyRecovery.importFailed)
  }
}
</script>

<template>
  <AlertDialog
    :open="props.open"
    @update:open="(o: boolean) => { if (!o) handleClose(); }"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t(($) => $.common.keyRecovery.title) }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ t(($) => $.common.keyRecovery.description) }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="space-y-3">
        <Input
          v-model="keyInput"
          :placeholder="t(($) => $.common.keyRecovery.placeholder)"
          class="font-mono text-sm"
          :disabled="state === 'importing'"
          @update:model-value="() => { if (state === 'error') state = 'input'; }"
        />

        <Alert>
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription class="text-xs">
            {{ t(($) => $.common.keyRecovery.securityWarning) }}
          </AlertDescription>
        </Alert>

        <Alert v-if="state === 'mismatch'" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            {{ t(($) => $.common.keyRecovery.mismatchWarning) }}
          </AlertDescription>
        </Alert>

        <Alert v-if="state === 'error' && errorMessage" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
      </div>

      <AlertDialogFooter>
        <Button
          variant="outline"
          :disabled="state === 'importing'"
          @click="handleClose"
        >
          {{
            state === "mismatch"
              ? t(($) => $.common.keyRecovery.cancel)
              : t(($) => $.common.cancel)
          }}
        </Button>

        <Button
          v-if="state === 'mismatch'"
          @click="handleImport(true)"
        >
          {{ t(($) => $.common.keyRecovery.forceImport) }}
        </Button>
        <Button
          v-else
          :disabled="state === 'importing' || !keyInput.trim()"
          @click="handleImport(false)"
        >
          <Loader2
            v-if="state === 'importing'"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{
            state === "importing"
              ? t(($) => $.common.keyRecovery.importing)
              : t(($) => $.common.keyRecovery.importButton)
          }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

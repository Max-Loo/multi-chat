<script setup lang="ts">
import { ref, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { AlertTriangle, Loader2 } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { importMasterKeyWithValidation } from '@/store/keyring/masterKey';
import { toastQueue } from '@/services/toast';

/**
 * 密钥恢复对话框属性
 */
interface KeyRecoveryDialogProps {
  /** 对话框是否打开 */
  open: boolean;
}

const props = defineProps<KeyRecoveryDialogProps>();

const emit = defineEmits<{
  /** 打开状态变化 */
  (e: 'update:open', open: boolean): void;
}>();

const { t } = useTranslation();

/** 对话框内部状态：输入中 | 导入中 | 密钥不匹配 | 出错 */
type DialogState = 'input' | 'importing' | 'mismatch' | 'error';

/** 用户输入的密钥 */
const keyInput = ref('');
/** 对话框状态 */
const state = ref<DialogState>('input');
/** 错误信息 */
const errorMessage = ref('');

/**
 * 关闭对话框（导入过程中不允许关闭），并重置内部状态
 */
function handleClose(): void {
  if (state.value === 'importing') return;

  state.value = 'input';
  keyInput.value = '';
  errorMessage.value = '';
  emit('update:open', false);
}

/**
 * 导入密钥
 * @param force 是否强制导入（忽略密钥不匹配校验）
 */
async function handleImport(force = false): Promise<void> {
  const trimmedKey = keyInput.value.trim();
  if (!trimmedKey) return;

  state.value = 'importing';

  try {
    const result = await importMasterKeyWithValidation(trimmedKey, force);

    if (result.success) {
      toastQueue.success(t('common.keyRecovery.importSuccess'));
      emit('update:open', false);
      window.location.reload();
      return;
    }

    if (result.keyMatched === false) {
      state.value = 'mismatch';
      return;
    }

    state.value = 'error';
    errorMessage.value = result.error || t('common.keyRecovery.mismatchWarning');
  } catch {
    state.value = 'error';
    errorMessage.value = t('common.keyRecovery.importFailed');
  }
}

/** 导入按钮是否禁用（导入中或输入为空） */
const isDisabled = () => state.value === 'importing' || !keyInput.value.trim();

// 对话框关闭时（如 Esc）同步重置状态
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen && state.value !== 'importing') {
      state.value = 'input';
      keyInput.value = '';
      errorMessage.value = '';
    }
  },
);
</script>

<!-- 密钥恢复对话框：供致命错误屏幕和 Toast 恢复流程共用 -->
<template>
  <AlertDialog
    :open="props.open"
    @update:open="(value: boolean) => { if (!value) handleClose(); }"
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ t('common.keyRecovery.title') }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{ t('common.keyRecovery.description') }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="space-y-3">
        <Input
          v-model="keyInput"
          :placeholder="t('common.keyRecovery.placeholder')"
          class="font-mono text-sm"
          :disabled="state === 'importing'"
          @update:model-value="() => { if (state === 'error') state = 'input'; }"
        />

        <Alert>
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription class="text-xs">
            {{ t('common.keyRecovery.securityWarning') }}
          </AlertDescription>
        </Alert>

        <Alert v-if="state === 'mismatch'" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>
            {{ t('common.keyRecovery.mismatchWarning') }}
          </AlertDescription>
        </Alert>

        <Alert v-if="state === 'error' && errorMessage" variant="destructive">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription>{{ errorMessage }}</AlertDescription>
        </Alert>
      </div>

      <AlertDialogFooter>
        <Button variant="outline" :disabled="state === 'importing'" @click="handleClose">
          {{
            state === 'mismatch'
              ? t('common.keyRecovery.cancel')
              : t('common.cancel')
          }}
        </Button>

        <Button v-if="state === 'mismatch'" @click="handleImport(true)">
          {{ t('common.keyRecovery.forceImport') }}
        </Button>
        <Button v-else :disabled="isDisabled()" @click="handleImport(false)">
          <Loader2
            v-if="state === 'importing'"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{
            state === 'importing'
              ? t('common.keyRecovery.importing')
              : t('common.keyRecovery.importButton')
          }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

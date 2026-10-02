<script setup lang="ts">
/**
 * 密钥恢复对话框组件（对应旧版 KeyRecoveryDialog/index.tsx）
 * 供 FatalErrorScreen 和 Toast 恢复流程共用
 */
import { ref } from 'vue';
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
import { useTranslation } from '@/composables/useTranslation';
import { AlertTriangle, Loader2 } from 'lucide-vue-next';

/** 组件属性 */
const props = defineProps<{
  open: boolean;
}>();

/** 开关变化事件 */
const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const { t } = useTranslation();

/** 对话框状态 */
type DialogState = 'input' | 'importing' | 'mismatch' | 'error';

const keyInput = ref('');
const state = ref<DialogState>('input');
const errorMessage = ref('');

/** 关闭对话框（导入中不允许关闭） */
const handleClose = (): void => {
  if (state.value !== 'importing') {
    state.value = 'input';
    keyInput.value = '';
    errorMessage.value = '';
    emit('update:open', false);
  }
};

/** 导入密钥（force 为 true 时强制覆盖） */
const handleImport = async (force = false): Promise<void> => {
  const trimmedKey = keyInput.value.trim();
  if (!trimmedKey) return;

  state.value = 'importing';

  try {
    const result = await importMasterKeyWithValidation(trimmedKey, force);

    if (result.success) {
      void toastQueue.success(t('common.keyRecovery.importSuccess'));
      emit('update:open', false);
      window.location.reload();
      return;
    }

    if (result.keyMatched === false) {
      state.value = 'mismatch';
      return;
    }

    state.value = 'error';
    errorMessage.value =
      result.error || t('common.keyRecovery.mismatchWarning');
  } catch {
    state.value = 'error';
    errorMessage.value = t('common.keyRecovery.importFailed');
  }
};

const isDisabled = ref(true);
// 计算 disabled：导入中或输入为空（模板内联更直观，此处保留可测试性）
void isDisabled;
</script>

<template>
  <AlertDialog
    :open="props.open"
    @update:open="(o: boolean) => { if (!o) handleClose(); }"
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
          :model-value="keyInput"
          :placeholder="t('common.keyRecovery.placeholder')"
          class="font-mono text-sm"
          :disabled="state === 'importing'"
          @update:model-value="(v: string) => {
            keyInput = v;
            if (state === 'error') state = 'input';
          }"
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
        <Button
          variant="outline"
          :disabled="state === 'importing'"
          @click="handleClose"
        >
          {{
            state === 'mismatch'
              ? t('common.keyRecovery.cancel')
              : t('common.cancel')
          }}
        </Button>

        <Button
          v-if="state === 'mismatch'"
          @click="handleImport(true)"
        >
          {{ t('common.keyRecovery.forceImport') }}
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
            state === 'importing'
              ? t('common.keyRecovery.importing')
              : t('common.keyRecovery.importButton')
          }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

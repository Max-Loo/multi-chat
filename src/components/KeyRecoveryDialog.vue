<script setup lang="ts">
/**
 * 密钥恢复对话框组件（Vue 版）
 * 供 FatalErrorScreen 和 Toast 恢复流程共用，行为与 React 版保持一致
 */
import { ref, watch, computed } from 'vue';
import { AlertTriangle, Loader2 } from 'lucide-vue-next';
import { Input } from '@/components/ui-vue/input';
import { Button } from '@/components/ui-vue/button';
import { AlertDialog } from '@/components/ui-vue/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui-vue/alert';
import { importMasterKeyWithValidation } from '@/store/keyring/masterKey';
import { toastQueue } from '@/services/toast';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{ open: boolean }>();

const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>();

type DialogState = 'input' | 'importing' | 'mismatch' | 'error';

const { t } = useTranslation();
const keyInput = ref('');
const state = ref<DialogState>('input');
const errorMessage = ref('');

const handleClose = () => {
  if (state.value !== 'importing') {
    state.value = 'input';
    keyInput.value = '';
    errorMessage.value = '';
    emit('update:open', false);
  }
};

const handleImport = async (force = false) => {
  const trimmedKey = keyInput.value.trim();
  if (!trimmedKey) return;

  state.value = 'importing';

  try {
    const result = await importMasterKeyWithValidation(trimmedKey, force);

    if (result.success) {
      toastQueue.success(t(($) => $.common.keyRecovery.importSuccess));
      emit('update:open', false);
      window.location.reload();
      return;
    }

    if (result.keyMatched === false) {
      state.value = 'mismatch';
      return;
    }

    state.value = 'error';
    errorMessage.value = result.error || t(($) => $.common.keyRecovery.mismatchWarning);
  } catch {
    state.value = 'error';
    errorMessage.value = t(($) => $.common.keyRecovery.importFailed);
  }
};

// 导入中或输入为空时禁用（响应式：随 state/keyInput 变化）
const isDisabled = computed(() => state.value === 'importing' || !keyInput.value.trim());

// 对话框关闭时重置输入状态
watch(
  () => props.open,
  (open) => {
    if (!open && state.value !== 'importing') {
      state.value = 'input';
      keyInput.value = '';
      errorMessage.value = '';
    }
  },
);
</script>

<template>
  <!-- ui-vue 的 AlertDialog 自带 Portal/Overlay/Content，内容直接放默认插槽（勿再嵌套 Content） -->
  <AlertDialog :open="props.open" @update:open="(o: boolean) => { if (!o) handleClose(); }">
    <div class="flex flex-col gap-1.5">
      <h2 class="text-lg font-semibold">{{ t(($) => $.common.keyRecovery.title) }}</h2>
      <p class="text-sm text-muted-foreground">{{ t(($) => $.common.keyRecovery.description) }}</p>
    </div>

    <div class="space-y-3">
      <Input
        v-model="keyInput"
        :disabled="state === 'importing'"
        :placeholder="t(($) => $.common.keyRecovery.placeholder)"
        class="font-mono text-sm"
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
        <AlertDescription>{{ t(($) => $.common.keyRecovery.mismatchWarning) }}</AlertDescription>
      </Alert>

      <Alert v-if="state === 'error' && errorMessage" variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>{{ errorMessage }}</AlertDescription>
      </Alert>
    </div>

    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" :disabled="state === 'importing'" @click="handleClose">
        {{ state === 'mismatch' ? t(($) => $.common.keyRecovery.cancel) : t(($) => $.common.cancel) }}
      </Button>

      <Button v-if="state === 'mismatch'" @click="handleImport(true)">
        {{ t(($) => $.common.keyRecovery.forceImport) }}
      </Button>
      <Button v-else :disabled="isDisabled" @click="handleImport(false)">
        <Loader2 v-if="state === 'importing'" class="mr-2 h-4 w-4 animate-spin" />
        {{ state === 'importing' ? t(($) => $.common.keyRecovery.importing) : t(($) => $.common.keyRecovery.importButton) }}
      </Button>
    </div>
  </AlertDialog>
</template>

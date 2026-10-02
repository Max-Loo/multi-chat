<script setup lang="ts">
/**
 * 密钥管理设置页面（对应旧版 KeyManagementSetting/index.tsx）
 * 提供密钥导出和全量数据重置功能
 */
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ResetDataDialog from '@/components/ResetDataDialog/ResetDataDialog.vue';
import { useScrollContainer } from '@/composables/useScrollContainer';
import { useResetDataDialog } from '@/composables/useResetDataDialog';
import { exportMasterKey } from '@/store/keyring/masterKey';
import { copyToClipboard } from '@/utils/clipboard';
import { toastQueue } from '@/services/toast';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();
const { scrollContainerRef, scrollbarClassname } = useScrollContainer();

// 字符串 ref 绑定（模板 ref="..."），显式引用避免 TS6133
void scrollContainerRef;

// 导出密钥相关状态：null 对话框关闭，'' 加载中，string 密钥值（展示+复制）
const exportState = ref<null | string>(null);

// 重置数据相关状态
const {
  isDialogOpen: isResetDialogOpen,
  setIsDialogOpen: setIsResetDialogOpen,
  isResetting,
  handleConfirmReset,
} = useResetDataDialog();

/** 导出主密钥 */
const handleExportKey = async (): Promise<void> => {
  try {
    exportState.value = '';
    const key = await exportMasterKey();
    exportState.value = key;
  } catch {
    void toastQueue.error(t('setting.keyManagement.exportFailed'));
    exportState.value = null;
  }
};

/** 复制已缓存的密钥到剪贴板，成功则关闭对话框，失败则保持打开以便手动复制 */
const handleCopyKey = async (): Promise<void> => {
  if (typeof exportState.value !== 'string') return;
  try {
    await copyToClipboard(exportState.value);
    void toastQueue.success(t('setting.keyManagement.exportSuccess'));
    exportState.value = null;
  } catch {
    void toastQueue.error(t('setting.keyManagement.exportFailed'));
  }
};

/** 关闭导出对话框 */
const handleExportDialogChange = (open: boolean): void => {
  if (!open) exportState.value = null;
};
</script>

<template>
  <div
    ref="scrollContainerRef"
    :class="`flex h-full w-full flex-col justify-start overflow-y-auto bg-gray-100 px-4 ${scrollbarClassname}`"
  >
    <!-- 密钥导出 -->
    <div
      class="my-4 flex w-full flex-row items-center justify-between rounded-xl bg-white p-3"
    >
      <div class="min-w-0 flex-1">
        <h3 class="mb-1 text-base font-medium">
          {{ t('setting.keyManagement.exportKey') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.keyManagement.exportKeyDescription') }}
        </p>
      </div>
      <Button
        :disabled="exportState !== null"
        class="ml-3 shrink-0"
        @click="handleExportKey"
      >
        {{ t('setting.keyManagement.exportKey') }}
      </Button>
    </div>

    <!-- 导出密钥对话框 -->
    <AlertDialog
      :open="exportState !== null"
      @update:open="handleExportDialogChange"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {{ t('setting.keyManagement.exportKey') }}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {{ t('setting.keyManagement.exportKeyDialogDescription') }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Input
          v-if="exportState === ''"
          readonly
          disabled
          model-value="..."
          class="font-mono text-sm"
        />
        <Input
          v-else-if="typeof exportState === 'string'"
          readonly
          :model-value="exportState"
          class="font-mono text-sm"
        />
        <AlertDialogFooter>
          <AlertDialogCancel>
            {{
              typeof exportState === 'string' && exportState !== ''
                ? t('common.hide')
                : t('common.cancel')
            }}
          </AlertDialogCancel>
          <Button v-if="exportState === ''" disabled>...</Button>
          <Button
            v-else-if="typeof exportState === 'string'"
            @click="handleCopyKey"
          >
            {{ t('setting.keyManagement.copyToClipboard') }}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 重置所有数据 -->
    <div
      class="my-4 flex w-full flex-row items-center justify-between rounded-xl bg-white p-3"
    >
      <div class="min-w-0 flex-1">
        <h3 class="mb-1 text-base font-medium">
          {{ t('setting.keyManagement.resetAllData') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.keyManagement.resetAllDataDescription') }}
        </p>
      </div>
      <Button
        variant="destructive"
        :disabled="isResetting"
        class="ml-3 shrink-0"
        @click="setIsResetDialogOpen(true)"
      >
        {{ t('setting.keyManagement.resetAllData') }}
      </Button>
    </div>

    <!-- 重置确认对话框 -->
    <ResetDataDialog
      :open="isResetDialogOpen"
      :is-resetting="isResetting"
      @update:open="setIsResetDialogOpen"
      @confirm="handleConfirmReset"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
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
import { useScrollContainer } from '@/composables/useScrollContainer';
import ResetDataDialog from '@/components/ResetDataDialog.vue';
import { exportMasterKey } from '@/store/keyring/masterKey';
import { copyToClipboard } from '@/utils/clipboard';
import { toastQueue } from '@/services/toast';

/**
 * 密钥管理设置页面
 * 提供密钥导出和全量数据重置功能
 */
const { t } = useTranslation();
const scroll = useScrollContainer();

// 导出密钥相关状态：null 对话框关闭，'' 加载中，string 密钥值（展示+复制）
const exportState = ref<null | string>(null);

// 重置数据对话框打开状态
const isResetDialogOpen = ref(false);

/** 导出主密钥 */
async function handleExportKey(): Promise<void> {
  try {
    exportState.value = '';
    const key = await exportMasterKey();
    exportState.value = key;
  } catch {
    toastQueue.error(t('setting.keyManagement.exportFailed'));
    exportState.value = null;
  }
}

/** 复制已缓存的密钥到剪贴板，成功则关闭对话框，失败则保持打开以便手动复制 */
async function handleCopyKey(): Promise<void> {
  if (typeof exportState.value !== 'string') return;
  try {
    await copyToClipboard(exportState.value);
    toastQueue.success(t('setting.keyManagement.exportSuccess'));
    exportState.value = null;
  } catch {
    toastQueue.error(t('setting.keyManagement.exportFailed'));
  }
}

/** 关闭导出对话框 */
function closeExportDialog(): void {
  exportState.value = null;
}
</script>

<!-- 密钥管理设置页面组件 -->
<template>
  <div
    :ref="(el) => { scroll.scrollContainerRef.value = el as HTMLDivElement | null; }"
    :class="[
      'flex flex-col justify-start w-full h-full px-4 overflow-y-auto bg-gray-100',
      scroll.scrollbarClassname,
    ]"
    @scroll="scroll.onScrollEvent"
  >
    <!-- 密钥导出 -->
    <div
      class="w-full p-3 my-4 bg-white rounded-xl flex flex-row items-center justify-between"
    >
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-medium mb-1">
          {{ t('setting.keyManagement.exportKey') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.keyManagement.exportKeyDescription') }}
        </p>
      </div>
      <Button
        :disabled="exportState !== null"
        class="shrink-0 ml-3"
        @click="handleExportKey"
      >
        {{ t('setting.keyManagement.exportKey') }}
      </Button>
    </div>

    <!-- 导出密钥对话框 -->
    <AlertDialog
      :open="exportState !== null"
      @update:open="(open: boolean) => { if (!open) closeExportDialog(); }"
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('setting.keyManagement.exportKey') }}</AlertDialogTitle>
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
      class="w-full p-3 my-4 bg-white rounded-xl flex flex-row items-center justify-between"
    >
      <div class="flex-1 min-w-0">
        <h3 class="text-base font-medium mb-1">
          {{ t('setting.keyManagement.resetAllData') }}
        </h3>
        <p class="text-sm text-muted-foreground">
          {{ t('setting.keyManagement.resetAllDataDescription') }}
        </p>
      </div>
      <Button
        variant="destructive"
        class="shrink-0 ml-3"
        @click="isResetDialogOpen = true"
      >
        {{ t('setting.keyManagement.resetAllData') }}
      </Button>
    </div>

    <!-- 重置确认对话框 -->
    <ResetDataDialog v-model:open="isResetDialogOpen" />
  </div>
</template>

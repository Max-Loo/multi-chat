<script setup lang="ts">
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Download } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { exportAllChats, exportDeletedChats } from '@/services/chatExport';
import { toastQueue } from '@/services/toast';

/**
 * 下载 JSON 文件（浏览器通用方案）
 * @param data 导出数据
 * @param filename 文件名
 */
function downloadJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 聊天导出设置组件
 */
const { t } = useTranslation();
const isExporting = ref(false);

/** 导出所有活跃聊天 */
async function handleExportAll(): Promise<void> {
  isExporting.value = true;
  try {
    const data = await exportAllChats();
    downloadJson(data, `chats-export-${Date.now()}.json`);
    toastQueue.success(t('setting.chatExport.exportSuccess'));
  } catch (error) {
    console.error('导出聊天失败:', error);
    toastQueue.error(t('setting.chatExport.exportFailed'));
  } finally {
    isExporting.value = false;
  }
}

/** 导出已删除聊天 */
async function handleExportDeleted(): Promise<void> {
  isExporting.value = true;
  try {
    const data = await exportDeletedChats();
    if (data.chats.length === 0) {
      toastQueue.info(t('setting.chatExport.noDeletedChats'));
      return;
    }
    downloadJson(data, `deleted-chats-export-${Date.now()}.json`);
    toastQueue.success(t('setting.chatExport.exportSuccess'));
  } catch (error) {
    console.error('导出已删除聊天失败:', error);
    toastQueue.error(t('setting.chatExport.exportFailed'));
  } finally {
    isExporting.value = false;
  }
}
</script>

<template>
  <div class="flex flex-col gap-3 w-full">
    <div class="flex items-center justify-between w-full">
      <div class="flex flex-col gap-1">
        <div class="text-base">{{ t('setting.chatExport.title') }}</div>
        <div class="text-sm text-gray-500">
          {{ t('setting.chatExport.description') }}
        </div>
      </div>
    </div>
    <div class="flex gap-2">
      <Button variant="outline" size="sm" :disabled="isExporting" @click="handleExportAll">
        <Download class="mr-2 h-4 w-4" />
        {{ t('setting.chatExport.exportAll') }}
      </Button>
      <Button variant="outline" size="sm" :disabled="isExporting" @click="handleExportDeleted">
        <Download class="mr-2 h-4 w-4" />
        {{ t('setting.chatExport.exportDeleted') }}
      </Button>
    </div>
  </div>
</template>

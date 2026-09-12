<script setup lang="ts">
/**
 * 错误提示组件（Vue 版 ErrorAlert）
 * 使用 Alert 组件显示刷新失败的错误信息
 */
import { AlertCircle } from 'lucide-vue-next';
import { Alert, AlertDescription } from '@/components/ui-vue/alert';
import { useTranslation } from '@/composables/useTranslation';

defineProps<{
  /** 错误信息 */
  error: string | null;
}>();

const { t } = useTranslation();
</script>

<template>
  <Alert v-if="error" variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertDescription>
      {{ t(($) => $.setting.modelProvider.refreshFailedPrefix) }} {{ error }}
    </AlertDescription>
  </Alert>
</template>

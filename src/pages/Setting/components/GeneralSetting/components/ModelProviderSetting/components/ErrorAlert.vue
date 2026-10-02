<script setup lang="ts">
/**
 * 错误提示组件（对应旧版 ErrorAlert.tsx）
 */
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-vue-next';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
defineProps<{ error: string | null }>();

const { t } = useTranslation();
</script>

<template>
  <Alert v-if="error" variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertDescription>
      {{ t('setting.modelProvider.refreshFailedPrefix') }} {{ error }}
    </AlertDescription>
  </Alert>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { AlertCircle } from 'lucide-vue-next';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * ErrorAlert 组件的属性
 */
interface ErrorAlertProps {
  /** 错误信息 */
  error: string | null;
}

const props = defineProps<ErrorAlertProps>();

const { t } = useTranslation();
</script>

<!-- 错误提示组件 -->
<template>
  <Alert v-if="props.error" variant="destructive">
    <AlertCircle class="h-4 w-4" />
    <AlertDescription>
      {{ t('setting.modelProvider.refreshFailedPrefix') }} {{ props.error }}
    </AlertDescription>
  </Alert>
</template>

<script setup lang="ts">
/**
 * 无可用模型供应商提示组件（对应旧版 NoProvidersAvailable.tsx）
 * 当应用无法获取任何模型供应商数据时显示
 */
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-vue-next';
import { useTranslation } from '@/composables/useTranslation';

const { t } = useTranslation();

/** 处理重新加载页面 */
const handleReload = (): void => {
  window.location.reload();
};
</script>

<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-background"
    data-testid="no-providers-container"
    role="alert"
  >
    <div
      class="flex max-w-md flex-col items-center gap-6 p-6 text-center"
      data-testid="no-providers-content"
    >
      <AlertCircle
        class="h-16 w-16 text-destructive"
        data-testid="no-providers-icon"
        role="img"
        :aria-label="t('common.errorIcon')"
      />

      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">
          {{ t('common.noProvidersAvailable') }}
        </h2>
        <p class="text-muted-foreground">
          {{ t('common.noProvidersDescription') }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ t('common.noProvidersHint') }}
        </p>
      </div>

      <Button size="lg" @click="handleReload">
        {{ t('common.reload') }}
      </Button>
    </div>
  </div>
</template>

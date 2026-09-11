<script setup lang="ts">
/**
 * 无可用模型供应商提示组件（Vue 版）
 * 当应用无法获取任何模型供应商数据时显示，行为与 React 版保持一致
 */
import { AlertCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useTranslation } from '@/composables/useTranslation';

/** 处理重新加载页面 */
const handleReload = () => {
  window.location.reload();
};

const { t } = useTranslation();
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-background" data-testid="no-providers-container" role="alert">
    <div class="flex max-w-md flex-col items-center gap-6 p-6 text-center" data-testid="no-providers-content">
      <AlertCircle
        class="h-16 w-16 text-destructive"
        data-testid="no-providers-icon"
        role="img"
        :aria-label="t(($) => $.common.errorIcon)"
      />

      <div class="space-y-2">
        <h2 class="text-2xl font-semibold">{{ t(($) => $.common.noProvidersAvailable) }}</h2>
        <p class="text-muted-foreground">
          {{ t(($) => $.common.noProvidersDescription) }}
        </p>
        <p class="text-sm text-muted-foreground">
          {{ t(($) => $.common.noProvidersHint) }}
        </p>
      </div>

      <Button size="lg" @click="handleReload">
        {{ t(($) => $.common.reload) }}
      </Button>
    </div>
  </div>
</template>

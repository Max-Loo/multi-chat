<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import { AlertCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

/**
 * 404 页面组件
 * 用于显示页面未找到的错误信息
 */
const router = useRouter();
const { t } = useTranslation();

/** 返回上一页 */
function goBack(): void {
  router.back();
}
</script>

<template>
  <div class="flex items-center justify-center h-full w-full">
    <div class="flex flex-col items-center justify-center space-y-6 p-8">
      <!-- 404 图标 -->
      <div class="relative">
        <AlertCircle
          class="h-32 w-32 text-muted-foreground/20"
          role="img"
          aria-label="error"
        />
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-6xl font-bold text-muted-foreground">404</span>
        </div>
      </div>

      <!-- 错误信息 -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-semibold text-foreground">
          {{ t('common.pageNotFound') }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t('common.pageNotFoundDescription') }}
        </p>
      </div>

      <!-- 返回按钮 -->
      <Button @click="goBack">{{ t('common.goBack') }}</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 404 页面（Vue 版 NotFound）
 * 用于显示页面未找到的错误信息
 */
import { AlertCircle } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useTranslation } from '@/composables/useTranslation';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useTranslation();

/** 返回上一页（等价 React 版 navigate(-1)） */
const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <div class="flex h-full w-full items-center justify-center">
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
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold text-foreground">
          {{ t(($) => $.common.pageNotFound) }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t(($) => $.common.pageNotFoundDescription) }}
        </p>
      </div>

      <!-- 返回按钮 -->
      <Button
        variant="default"
        size="default"
        @click="goBack"
      >
        {{ t(($) => $.common.goBack) }}
      </Button>
    </div>
  </div>
</template>

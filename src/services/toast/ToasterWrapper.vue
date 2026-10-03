<script lang="ts" setup>
import { watchEffect } from 'vue';
import { Toaster } from '@/components/ui/sonner';
import { toastQueue } from '@/services/toast/toastQueue';
import { useResponsive } from '@/composables/useResponsive';
import { useDark } from '@/composables/useDark';

/**
 * Toaster 包装组件
 * - 同步响应式状态到 toastQueue 单例
 * - 同步主题到 vue-sonner
 * - 确保 isMobile 初始化后再标记就绪，避免竞态条件
 */
const { isMobile } = useResponsive();
const { isDark } = useDark();

// 同步 isMobile 到 toastQueue（原 ToasterWrapper 的 useEffect 行为）
watchEffect(() => {
  if (isMobile.value !== undefined) {
    toastQueue.setIsMobile(isMobile.value);
  }
});

// isMobile 确定后标记就绪，触发队列刷新
watchEffect(() => {
  if (isMobile.value !== undefined) {
    toastQueue.markReady();
  }
});

// 同步主题（theme 值为 light/dark/system 语义，这里只有 light/dark 两态）
const toasterTheme = isDark;
</script>

<template>
  <Toaster
    position="bottom-right"
    :theme="toasterTheme ? 'dark' : 'light'"
    :swipe-directions="['right']"
    :offset="{ bottom: 24, right: 24 }"
    class="toaster group"
  />
</template>

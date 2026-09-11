<script setup lang="ts">
/**
 * 应用布局壳（Vue 版 Layout）
 * 桌面端：左侧边栏 + 主内容；移动端：主内容 + 底部导航
 * 行为与 React 版 Layout 保持一致
 */
import { Suspense } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import BottomNav from '@/components/BottomNav.vue';
import PageSkeleton from '@/components/ui-vue/skeleton/PageSkeleton.vue';
import { useResponsive } from '@/composables/useResponsive';

const props = defineProps<{ class?: string }>();

const { isMobile } = useResponsive();
</script>

<template>
  <div
    data-testid="layout-root"
    :class="`flex h-screen bg-white ${isMobile ? 'flex-col' : ''} ${props.class ?? ''}`"
  >
    <!-- 侧边导航栏：在所有非 Mobile 模式下显示 (方案A) -->
    <Sidebar v-if="!isMobile" />

    <!-- 主内容区域 -->
    <div role="main" data-testid="layout-main" :class="`flex-1 overflow-y-hidden ${isMobile ? 'pb-16' : ''}`">
      <Suspense>
        <router-view />
        <template #fallback>
          <PageSkeleton />
        </template>
      </Suspense>
    </div>

    <!-- 底部导航栏：仅在 Mobile 模式下显示 (方案A) -->
    <BottomNav v-if="isMobile" />
  </div>
</template>

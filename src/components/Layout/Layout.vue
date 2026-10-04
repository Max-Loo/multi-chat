<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageSkeleton } from '@/components/Skeleton';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 应用布局组件
 *
 * 桌面端：左侧边栏 + 主内容区；移动端：主内容区（底部留白）+ 底部导航栏
 */
const { isMobile } = useResponsive();

/** 根元素类名（移动端纵向排列） */
const rootClass = computed(() => [
  'flex h-screen bg-white',
  isMobile.value ? 'flex-col' : '',
]);
</script>

<template>
  <div data-testid="layout-root" :class="rootClass">
    <!-- 侧边导航栏：在所有非 Mobile 模式下显示 -->
    <Sidebar v-if="!isMobile" />

    <!-- 主内容区域 -->
    <div
      role="main"
      data-testid="layout-main"
      :class="['flex-1 overflow-y-hidden', isMobile && 'pb-16']"
    >
      <RouterView v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <PageSkeleton />
          </template>
        </Suspense>
      </RouterView>
    </div>

    <!-- 底部导航栏：仅在 Mobile 模式下显示 -->
    <BottomNav v-if="isMobile" />
  </div>
</template>

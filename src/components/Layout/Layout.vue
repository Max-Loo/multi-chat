<script setup lang="ts">
/**
 * 应用布局组件（对应旧版 Layout/index.tsx）
 *
 * 桌面端：左侧 Sidebar + 主内容区；移动端：主内容区 + 底部 BottomNav。
 * 主内容区通过 Suspense 承载路由懒加载页面。
 */
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import Sidebar from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { PageSkeleton } from '@/components/Skeleton';
import { useResponsive } from '@/composables/useResponsive';
import { cn } from '@/utils/utils';

const props = withDefaults(defineProps<{ class?: string }>(), {
  class: '',
});

const { isMobile } = useResponsive();

const rootClass = computed(() =>
  cn('flex h-screen bg-white', isMobile.value && 'flex-col', props.class),
);

const mainClass = computed(() =>
  cn('flex-1 overflow-y-hidden', isMobile.value && 'pb-16'),
);
</script>

<template>
  <div data-testid="layout-root" :class="rootClass">
    <!-- 侧边导航栏：在所有非 Mobile 模式下显示 (方案A) -->
    <Sidebar v-if="!isMobile" />

    <!-- 主内容区域 -->
    <div role="main" data-testid="layout-main" :class="mainClass">
      <RouterView v-slot="{ Component }">
        <Suspense>
          <component :is="Component" />
          <template #fallback>
            <PageSkeleton />
          </template>
        </Suspense>
      </RouterView>
    </div>

    <!-- 底部导航栏：仅在 Mobile 模式下显示 (方案A) -->
    <BottomNav v-if="isMobile" />
  </div>
</template>

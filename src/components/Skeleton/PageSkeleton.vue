<script setup lang="ts">
import { computed } from "vue";
import { useResponsive } from "@/composables/useResponsive";
import MainContentSkeleton from "./MainContentSkeleton.vue";
import SidebarSkeleton from "./SidebarSkeleton.vue";

/**
 * 页面级骨架屏组件
 *
 * 用于 Layout 的路由懒加载 fallback，根据设备类型渲染不同布局
 *
 * @example
 * <RouterView v-slot="{ Component }">
 *   <Suspense :fallback="PageSkeleton">
 *     <component :is="Component" />
 *   </Suspense>
 * </RouterView>
 */
const { isMobile } = useResponsive();

/** 移动端布局标志（计算属性保证断点切换时重新渲染） */
const showMobileLayout = computed(() => isMobile.value);
</script>

<template>
  <!-- 移动端布局：主内容区域 + 底部导航占位 -->
  <div v-if="showMobileLayout" class="flex flex-col h-screen bg-white" aria-hidden="true">
    <MainContentSkeleton />
    <div
      data-testid="mobile-bottom-nav-placeholder"
      class="h-16 bg-gray-50 border-t border-gray-200 shrink-0"
    />
  </div>

  <!-- 桌面端布局：侧边栏 + 主内容区域 -->
  <div v-else class="flex h-screen bg-white" aria-hidden="true">
    <SidebarSkeleton />
    <MainContentSkeleton />
  </div>
</template>

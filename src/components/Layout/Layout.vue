<script setup lang="ts">
import { computed } from "vue";
import { RouterView } from "vue-router";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { PageSkeleton } from "@/components/Skeleton";
import { useResponsive } from "@/composables/useResponsive";

/**
 * 应用布局组件
 * 桌面端：左侧边栏 + 主内容；移动端：主内容 + 底部导航
 */

/**
 * 布局组件属性
 */
interface LayoutProps {
  /** 自定义类名 */
  className?: string;
}

const props = withDefaults(defineProps<LayoutProps>(), {
  className: "",
});

const { isMobile } = useResponsive();

/** 主内容区域类名（移动端增加底部导航避让间距） */
const mainClasses = computed(
  () => `flex-1 overflow-y-hidden ${isMobile.value ? "pb-16" : ""}`,
);

/** 根元素类名 */
const rootClasses = computed(
  () =>
    `flex h-screen bg-white ${isMobile.value ? "flex-col" : ""} ${props.className}`,
);
</script>

<template>
  <div data-testid="layout-root" :class="rootClasses">
    <!-- 侧边导航栏：在所有非 Mobile 模式下显示 (方案A) -->
    <Sidebar v-if="!isMobile" />

    <!-- 主内容区域 -->
    <div role="main" data-testid="layout-main" :class="mainClasses">
      <RouterView v-slot="{ Component }">
        <Suspense :timeout="0">
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

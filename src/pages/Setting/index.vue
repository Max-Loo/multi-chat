<script setup lang="ts">
/**
 * 设置页面（Vue 版 SettingPage）
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
import { computed } from 'vue';
import SettingSidebar from '@/pages/Setting/components/SettingSidebar.vue';
import SettingHeader from '@/pages/Setting/components/SettingHeader.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { useSettingPageStore } from '@/store/pinia/settingPage';

const { isMobile } = useResponsive();
const { t } = useTranslation();
const settingPageStore = useSettingPageStore();

const isDrawerOpen = computed(() => settingPageStore.isDrawerOpen);

/**
 * 处理抽屉打开/关闭状态变化
 * @param open 新的开关状态
 */
const handleDrawerOpenChange = (open: boolean) => {
  settingPageStore.setIsDrawerOpen(open);
};
</script>

<template>
  <div class="relative flex h-full w-full items-start justify-start">
    <!-- 移动端：抽屉 -->
    <template v-if="isMobile">
      <MobileDrawer
        :open="isDrawerOpen"
        :show-close-button="false"
        @update:open="handleDrawerOpenChange"
      >
        <SettingSidebar />
      </MobileDrawer>
      <SettingHeader />
    </template>

    <!-- 桌面端：直接显示侧边栏（无折叠功能） -->
    <aside
      v-if="!isMobile"
      class="h-full w-64 shrink-0 border-r border-gray-200"
      :aria-label="t(($) => $.common.a11y.settingsNav) as string"
    >
      <SettingSidebar />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="setting-content"
      :class="`relative h-full w-full flex-1 overflow-y-auto ${isMobile ? 'pt-12' : ''}`"
    >
      <router-view />
    </main>
  </div>
</template>

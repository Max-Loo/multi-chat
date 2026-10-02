<script setup lang="ts">
/**
 * 设置页面（对应旧版 pages/Setting/index.tsx）
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
import { storeToRefs } from 'pinia';
import { RouterView } from 'vue-router';
import SettingSidebar from './components/SettingSidebar.vue';
import SettingHeader from './components/SettingHeader.vue';
import { useSettingPageStore } from '@/stores';
import { useResponsive } from '@/composables/useResponsive';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useTranslation } from '@/composables/useTranslation';

const { isMobile } = useResponsive();
const { t } = useTranslation();
const settingPageStore = useSettingPageStore();
const { isDrawerOpen } = storeToRefs(settingPageStore);

/** 处理抽屉打开/关闭状态变化 */
const handleDrawerOpenChange = (open: boolean): void => {
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
      :aria-label="t('common.a11y.settingsNav')"
    >
      <SettingSidebar />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="setting-content"
      :class="`relative h-full w-full flex-1 overflow-y-auto ${isMobile && 'pt-12'}`"
    >
      <RouterView />
    </main>
  </div>
</template>

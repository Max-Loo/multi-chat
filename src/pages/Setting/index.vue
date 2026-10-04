<script setup lang="ts">
import { RouterView } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import SettingSidebar from '@/pages/Setting/components/SettingSidebar.vue';
import SettingHeader from '@/pages/Setting/components/SettingHeader.vue';
import { useSettingPageStore } from '@/store/settingPage';
import { useResponsive } from '@/composables/useResponsive';
import { MobileDrawer } from '@/components/MobileDrawer';

/**
 * 设置页面
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
const { t } = useTranslation();
const { isMobile } = useResponsive();
const settingPageStore = useSettingPageStore();

/** 处理抽屉打开/关闭状态变化 */
function handleDrawerOpenChange(open: boolean): void {
  settingPageStore.setIsDrawerOpen(open);
}
</script>

<template>
  <div class="flex items-start justify-start w-full h-full relative">
    <!-- 移动端：抽屉 -->
    <template v-if="isMobile">
      <MobileDrawer
        :open="settingPageStore.isDrawerOpen"
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
      class="w-64 h-full border-r border-gray-200 shrink-0"
      :aria-label="t('common.a11y.settingsNav')"
    >
      <SettingSidebar />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="setting-content"
      :class="['flex-1 w-full h-full overflow-y-auto relative', isMobile && 'pt-12']"
    >
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置页面 Header 组件（Vue 版 SettingHeader）
 * 在移动端显示菜单按钮，用于打开设置侧边栏抽屉
 */
import { Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { useSettingPageStore } from '@/store/pinia/settingPage';

const settingPageStore = useSettingPageStore();
const { t } = useTranslation();
const { isMobile } = useResponsive();

/** 打开抽屉 */
const openDrawer = () => {
  settingPageStore.toggleDrawer();
};
</script>

<template>
  <div class="fixed left-0 top-0 z-10 flex h-12 w-full items-center border-b border-gray-200 bg-white px-4">
    <Button
      v-if="isMobile"
      variant="ghost"
      class="mr-2 h-8 w-8 rounded p-0"
      :aria-label="t(($) => $.setting.openMenu) as string"
      @click="openDrawer"
    >
      <Menu class="h-5 w-5" />
    </Button>
    <h1 class="text-base font-semibold">{{ t(($) => $.setting.title) }}</h1>
  </div>
</template>

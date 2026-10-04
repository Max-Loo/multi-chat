<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useSettingPageStore } from '@/store/settingPage';
import { useResponsive } from '@/composables/useResponsive';

/**
 * 设置页面 Header 组件
 * 在移动端显示菜单按钮，用于打开设置侧边栏抽屉
 */
const { t } = useTranslation();
const settingPageStore = useSettingPageStore();
const { isMobile } = useResponsive();

/** 打开抽屉 */
function openDrawer(): void {
  settingPageStore.toggleDrawer();
}
</script>

<template>
  <div
    class="flex items-center w-full h-12 px-4 border-b border-gray-200 fixed top-0 left-0 bg-white z-10"
  >
    <Button
      v-if="isMobile"
      variant="ghost"
      class="rounded mr-2 h-8 w-8 p-0"
      :aria-label="t('setting.openMenu')"
      @click="openDrawer"
    >
      <Menu class="h-5 w-5" />
    </Button>
    <h1 class="text-base font-semibold">{{ t('setting.title') }}</h1>
  </div>
</template>

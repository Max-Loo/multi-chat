<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { ArrowLeft, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useModelPageStore } from '@/store/modelPage';
import { useResponsive } from '@/composables/useResponsive';
import { useRouter } from 'vue-router';

/**
 * 模型创建页面 Header 组件
 * 在移动端显示返回按钮和菜单按钮，用于返回上一页和打开模型侧边栏抽屉
 */
const { t } = useTranslation();
const modelPageStore = useModelPageStore();
const { isMobile } = useResponsive();
const router = useRouter();

/** 打开抽屉 */
function openDrawer(): void {
  modelPageStore.toggleDrawer();
}

/** 返回上一页 */
function handleBack(): void {
  router.push('/model/table');
}
</script>

<template>
  <div
    class="flex items-center w-full h-12 px-4 border-b border-gray-200 fixed top-0 left-0 z-10 bg-white"
  >
    <template v-if="isMobile">
      <Button
        variant="ghost"
        class="rounded mr-2 h-8 w-8 p-0"
        :aria-label="t('common.goBack')"
        @click="handleBack"
      >
        <ArrowLeft :size="16" />
      </Button>
      <Button
        variant="ghost"
        class="rounded mr-2 h-8 w-8 p-0"
        :aria-label="t('model.openMenu')"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
    </template>
    <h1 class="text-base font-semibold">{{ t('model.title') }}</h1>
  </div>
</template>

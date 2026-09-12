<script setup lang="ts">
/**
 * 模型创建页面 Header 组件（Vue 版 ModelHeader）
 * 移动端显示返回按钮和菜单按钮，用于返回上一页和打开模型侧边栏抽屉
 */
import { ArrowLeft, Menu } from 'lucide-vue-next';
import { Button } from '@/components/ui-vue/button';
import { useModelPageStore } from '@/store/pinia/modelPage';
import { useResponsive } from '@/composables/useResponsive';
import { useTranslation } from '@/composables/useTranslation';
import { useRouter } from 'vue-router';

const { t } = useTranslation();
const { isMobile } = useResponsive();
const router = useRouter();
const modelPageStore = useModelPageStore();

/** 打开抽屉 */
const openDrawer = () => {
  modelPageStore.toggleDrawer();
};

/** 返回上一页 */
const handleBack = () => {
  void router.push('/model/table');
};
</script>

<template>
  <div class="fixed left-0 top-0 z-10 flex h-12 w-full items-center border-b border-gray-200 bg-white px-4">
    <template v-if="isMobile">
      <Button
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :aria-label="t('common.goBack') as string"
        @click="handleBack"
      >
        <ArrowLeft size="16" />
      </Button>
      <Button
        variant="ghost"
        class="mr-2 h-8 w-8 rounded p-0"
        :aria-label="t('model.openMenu') as string"
        @click="openDrawer"
      >
        <Menu class="h-5 w-5" />
      </Button>
    </template>
    <h1 class="text-base font-semibold">{{ t('model.title') }}</h1>
  </div>
</template>

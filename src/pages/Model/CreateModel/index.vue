<script setup lang="ts">
/**
 * 添加模型页面（对应旧版 CreateModel/index.tsx）
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import ModelSidebar from './components/ModelSidebar.vue';
import ModelHeader from './components/ModelHeader.vue';
import { ModelProviderKeyEnum } from '@/utils/enums';
import ModelConfigForm from '../components/ModelConfigForm.vue';
import type { Model } from '@/types/model';
import { useModelStore, useModelPageStore } from '@/stores';
import { useResponsive } from '@/composables/useResponsive';
import { MobileDrawer } from '@/components/MobileDrawer';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

const { t } = useTranslation();
const { isMobile } = useResponsive();
const modelStore = useModelStore();
const modelPageStore = useModelPageStore();
const router = useRouter();
const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

const selectedModelProviderKey = ref<ModelProviderKeyEnum>(
  ModelProviderKeyEnum.DEEPSEEK,
);

const { isDrawerOpen } = storeToRefs(modelPageStore);

/** 表单校验完成后的回调 */
const onFormFinish = (model: Model): void => {
  try {
    modelStore.createModel(model);

    void toastQueue.success(t('model.addModelSuccess'));
    // 返回到列表页面
    void router.push('/model/table');
  } catch {
    void toastQueue.error(t('model.addModelFailed'));
  }
};
</script>

<template>
  <div class="flex h-full w-full items-start justify-start">
    <!-- 移动端：抽屉 -->
    <template v-if="isMobile">
      <MobileDrawer
        :open="isDrawerOpen"
        :show-close-button="false"
        @update:open="(open: boolean) => modelPageStore.setIsDrawerOpen(open)"
      >
        <ModelSidebar
          v-model:model-value="selectedModelProviderKey"
        />
      </MobileDrawer>
      <ModelHeader />
    </template>

    <!-- 桌面端：直接显示侧边栏（无折叠功能） -->
    <aside
      v-if="!isMobile"
      class="h-full shrink-0 border-r border-gray-200"
      data-testid="model-sidebar"
      :aria-label="t('common.a11y.modelProvider')"
    >
      <ModelSidebar v-model:model-value="selectedModelProviderKey" />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="model-content"
      :class="`h-full w-full flex-1 overflow-y-auto p-4 ${isMobile && 'mt-12'} ${scrollbarClassname}`"
      @scroll="onScrollEvent"
    >
      <ModelConfigForm
        :model-provider-key="selectedModelProviderKey"
        @finish="onFormFinish"
      />
    </main>
  </div>
</template>

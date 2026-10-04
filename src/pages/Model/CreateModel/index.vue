<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useTranslation } from 'i18next-vue';
import ModelSidebar from './components/ModelSidebar.vue';
import ModelHeader from './components/ModelHeader.vue';
import { ModelProviderKeyEnum } from '@/utils/enums';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import type { Model } from '@/types/model';
import { useModelsStore } from '@/store/models';
import { useModelPageStore } from '@/store/modelPage';
import { useResponsive } from '@/composables/useResponsive';
import { MobileDrawer } from '@/components/MobileDrawer';
import { toastQueue } from '@/services/toast';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';

/**
 * 添加模型页面
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
const { t } = useTranslation();
const { isMobile } = useResponsive();
const router = useRouter();
const modelsStore = useModelsStore();
const modelPageStore = useModelPageStore();
const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

const selectedModelProviderKey = ref<ModelProviderKeyEnum>(
  ModelProviderKeyEnum.DEEPSEEK,
);

/** 表单校验完成后的回调 */
function onFormFinish(model: Model): void {
  modelsStore
    .createModel({ model })
    .then(() => {
      toastQueue.success(t('model.addModelSuccess'));
      // 返回到列表页面
      router.push('/model/table');
    })
    .catch(() => {
      toastQueue.error(t('model.addModelFailed'));
    });
}
</script>

<template>
  <div class="flex items-start justify-start h-full w-full">
    <!-- 移动端：抽屉 -->
    <template v-if="isMobile">
      <MobileDrawer
        :open="modelPageStore.isDrawerOpen"
        show-close-button
        @update:open="(open: boolean) => modelPageStore.setIsDrawerOpen(open)"
      >
        <ModelSidebar v-model:model-provider-key="selectedModelProviderKey" />
      </MobileDrawer>
      <ModelHeader />
    </template>

    <!-- 桌面端：直接显示侧边栏（无折叠功能） -->
    <aside
      v-if="!isMobile"
      class="h-full border-r border-gray-200 shrink-0"
      data-testid="model-sidebar"
      :aria-label="t('common.a11y.modelProvider')"
    >
      <ModelSidebar v-model:model-provider-key="selectedModelProviderKey" />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="model-content"
      :class="['flex-1 w-full h-full overflow-y-auto p-4', isMobile && 'mt-12', scrollbarClassname]"
      @scroll="onScrollEvent"
    >
      <ModelConfigForm
        :model-provider-key="selectedModelProviderKey"
        :on-finish="onFormFinish"
      />
    </main>
  </div>
</template>

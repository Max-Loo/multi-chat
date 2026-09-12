<script setup lang="ts">
/**
 * 添加模型页面（Vue 版 CreateModel）
 * 支持响应式布局：移动端使用抽屉，桌面端固定显示侧边栏
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import ModelSidebar from './CreateModel/components/ModelSidebar.vue';
import ModelHeader from './CreateModel/components/ModelHeader.vue';
import ModelConfigForm from '@/pages/Model/components/ModelConfigForm.vue';
import MobileDrawer from '@/components/MobileDrawer.vue';
import { useModelStore } from '@/store/pinia/model';
import { useModelPageStore } from '@/store/pinia/modelPage';
import { useResponsive } from '@/composables/useResponsive';
import { useAdaptiveScrollbar } from '@/composables/useAdaptiveScrollbar';
import { useTranslation } from '@/composables/useTranslation';
import { toastQueue } from '@/services/toast';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { Model } from '@/types/model';

const { t } = useTranslation();
const { isMobile } = useResponsive();
const router = useRouter();
const modelStore = useModelStore();
const modelPageStore = useModelPageStore();
const { scrollbarClassname, onScrollEvent } = useAdaptiveScrollbar();

const selectedModelProviderKey = ref<ModelProviderKeyEnum>(ModelProviderKeyEnum.DEEPSEEK);

const isDrawerOpen = computed(() => modelPageStore.isDrawerOpen);

/** 处理抽屉打开/关闭状态变化 */
const handleDrawerOpenChange = (open: boolean) => {
  modelPageStore.setIsDrawerOpen(open);
};

/** 表单校验完成后的回调 */
const onFormFinish = (model: Model): void => {
  modelStore
    .createModel({ model })
    .then(() => {
      toastQueue.success(t('model.addModelSuccess') as string);
      // 返回到列表页面
      void router.push('/model/table');
    })
    .catch(() => {
      toastQueue.error(t('model.addModelFailed') as string);
    });
};
</script>

<template>
  <div class="flex h-full w-full items-start justify-start">
    <!-- 移动端：抽屉 + Header -->
    <template v-if="isMobile">
      <MobileDrawer :open="isDrawerOpen" :show-close-button="false" @update:open="handleDrawerOpenChange">
        <ModelSidebar
          :value="selectedModelProviderKey"
          @change="selectedModelProviderKey = $event"
        />
      </MobileDrawer>
      <ModelHeader />
    </template>

    <!-- 桌面端：直接显示侧边栏（无折叠功能） -->
    <aside
      v-if="!isMobile"
      class="h-full shrink-0 border-r border-gray-200"
      data-testid="model-sidebar"
      :aria-label="t('common.a11y.modelProvider') as string"
    >
      <ModelSidebar
        :value="selectedModelProviderKey"
        @change="selectedModelProviderKey = $event"
      />
    </aside>

    <!-- 主内容区域 -->
    <main
      data-testid="model-content"
      :class="`h-full w-full flex-1 overflow-y-auto p-4 ${isMobile ? 'mt-12' : ''} ${scrollbarClassname}`"
      @scroll="onScrollEvent"
    >
      <ModelConfigForm
        :model-provider-key="selectedModelProviderKey"
        @finish="onFormFinish"
      />
    </main>
  </div>
</template>

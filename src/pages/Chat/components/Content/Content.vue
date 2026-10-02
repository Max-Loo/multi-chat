<script setup lang="ts">
/**
 * 聊天页面的具体内容（对应旧版 Content/index.tsx）
 *
 * 根据选中聊天状态切换：占位 / 模型选择 / 聊天面板。
 */
import { computed, defineAsyncComponent } from 'vue';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import { isNil } from 'es-toolkit';
import Placeholder from '@/pages/Chat/components/Placeholder/Placeholder.vue';
import ModelSelectSkeleton from '@/pages/Chat/components/ModelSelect/Skeleton.vue';
import PanelSkeleton from '@/pages/Chat/components/Panel/Skeleton.vue';

// 异步组件（对应旧版 lazy）
const ModelSelect = defineAsyncComponent(
  () => import('@/pages/Chat/components/ModelSelect/ModelSelect.vue'),
);
const Panel = defineAsyncComponent(
  () => import('@/pages/Chat/components/Panel/Panel.vue'),
);

const selectedChat = useCurrentSelectedChat();

// 是否已选中聊天
const hasChat = computed(() => !isNil(selectedChat.value));

// 是否已配置模型
const hasModels = computed(
  () =>
    hasChat.value &&
    Array.isArray(selectedChat.value?.chatModelList) &&
    (selectedChat.value?.chatModelList?.length ?? 0) > 0,
);

// 面板骨架屏列数
const panelSkeletonColumnCount = computed(
  () => selectedChat.value?.chatModelList?.length ?? 1,
);
</script>

<template>
  <!-- 默认占位内容 -->
  <Placeholder v-if="!hasChat" />

  <!-- 还没有给这个「聊天」配置过模型的状态 -->
  <Suspense v-else-if="!hasModels">
    <ModelSelect />
    <template #fallback>
      <ModelSelectSkeleton />
    </template>
  </Suspense>

  <!-- 正常的聊天框 -->
  <Suspense v-else>
    <Panel />
    <template #fallback>
      <PanelSkeleton :column-count="panelSkeletonColumnCount" />
    </template>
  </Suspense>
</template>

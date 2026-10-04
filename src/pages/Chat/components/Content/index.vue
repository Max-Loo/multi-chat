<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { isNil } from 'es-toolkit';
import Placeholder from '@/pages/Chat/components/Placeholder/index.vue';
import ModelSelectSkeleton from '@/pages/Chat/components/ModelSelect/Skeleton.vue';
import PanelSkeleton from '@/pages/Chat/components/Panel/Skeleton.vue';
import { useChatPageSelectedChat } from '@/pages/Chat/composables/useSelectedChat';

// 面板与模型选择按需加载
const ModelSelect = defineAsyncComponent(
  () => import('@/pages/Chat/components/ModelSelect/index.vue'),
);
const Panel = defineAsyncComponent(
  () => import('@/pages/Chat/components/Panel/index.vue'),
);

/**
 * 聊天页面的具体内容：根据选中聊天状态渲染占位/模型选择/聊天面板
 */
const { selectedChat, chatModelList } = useChatPageSelectedChat();

/** 是否还没有给这个「聊天」配置过模型 */
const hasNoModels = computed(
  () =>
    !Array.isArray(selectedChat.value?.chatModelList) ||
    chatModelList.value.length <= 0,
);
</script>

<template>
  <!-- 默认占位内容 -->
  <Placeholder v-if="isNil(selectedChat)" />

  <!-- 尚未配置模型：选择模型 -->
  <Suspense v-else-if="hasNoModels">
    <ModelSelect />
    <template #fallback>
      <ModelSelectSkeleton />
    </template>
  </Suspense>

  <!-- 正常的聊天框 -->
  <Suspense v-else>
    <Panel />
    <template #fallback>
      <PanelSkeleton :column-count="chatModelList.length" />
    </template>
  </Suspense>
</template>

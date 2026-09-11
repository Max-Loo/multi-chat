<script setup lang="ts">
/**
 * 聊天页面的具体内容（Vue 版 Content）
 * 三级分支：未选择聊天 → 占位；未配置模型 → ModelSelect；已配置 → Panel
 */
import { computed, defineAsyncComponent } from 'vue';
import { isNil } from 'es-toolkit';
import { useCurrentSelectedChat } from '@/composables/useCurrentSelectedChat';
import Placeholder from '@/pages/Chat/components/Placeholder/Placeholder.vue';
import ModelSelectSkeleton from '@/pages/Chat/components/ModelSelect/ModelSelectSkeleton.vue';
import PanelSkeleton from '@/pages/Chat/components/Panel/PanelSkeleton.vue';

// 懒加载重型组件（骨架屏作为加载占位）
const ModelSelect = defineAsyncComponent({
  loader: () => import('@/pages/Chat/components/ModelSelect/ModelSelect.vue'),
  loadingComponent: ModelSelectSkeleton,
});
const Panel = defineAsyncComponent({
  loader: () => import('@/pages/Chat/components/Panel/Panel.vue'),
  loadingComponent: PanelSkeleton,
});

const selectedChat = useCurrentSelectedChat();

// 还没有给这个「聊天」配置过模型的状态
const hasNoModels = computed(
  () =>
    !isNil(selectedChat.value) &&
    (!Array.isArray(selectedChat.value.chatModelList) || selectedChat.value.chatModelList.length <= 0),
);
</script>

<template>
  <!-- 默认占位内容 -->
  <Placeholder v-if="isNil(selectedChat)" />

  <!-- 还没有给这个「聊天」配置过模型的状态 -->
  <ModelSelect v-else-if="hasNoModels" />

  <!-- 正常的聊天框 -->
  <Panel v-else />
</template>

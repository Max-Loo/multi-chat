<script setup lang="ts">
/**
 * 详情面板标题（Vue 版 Title）
 * 显示模型昵称/名称、供应商 logo 与状态徽章（tooltip 详情）
 */
import { computed } from 'vue';
import { Badge } from '@/components/ui-vue/badge';
import { Tooltip } from '@/components/ui-vue/tooltip';
import { ProviderLogo } from '@/components/ProviderLogo/ProviderLogo.vue';
import { useModelStore } from '@/store/pinia/model';
import { isNil } from 'es-toolkit';
import { useTranslation } from '@/composables/useTranslation';
import type { ChatModel } from '@/types/chat';

const props = defineProps<{ chatModel: ChatModel }>();

const { t } = useTranslation();
const modelStore = useModelStore();

// 当前展示的模型在模型列表里面的完整版
const currentModel = computed(() =>
  modelStore.models.find((model) => model.id === props.chatModel.modelId),
);

// 显示名称：昵称非空时显示「昵称 (模型名)」，否则仅显示模型名
const displayName = computed(() => {
  const model = currentModel.value;
  if (!model) return '';
  return model.nickname ? `${model.nickname} (${model.modelName})` : model.modelName;
});
</script>

<template>
  <!-- 模型不存在时显示错误提示 -->
  <Badge v-if="isNil(currentModel)" variant="destructive">
    {{ t('chat.modelDeleted') }}
  </Badge>

  <Tooltip
    v-else
    :content="`${t('chat.supplier')}: ${currentModel!.providerName} / ${t('chat.model')}: ${currentModel!.modelName} / ${t('chat.nickname')}: ${currentModel!.nickname || '-'}`"
  >
    <div class="flex min-w-0 cursor-default items-center gap-2">
      <ProviderLogo
        :provider-key="currentModel!.providerKey"
        :provider-name="currentModel!.providerName"
        :size="24"
      />
      <h3 class="truncate">{{ displayName }}</h3>
      <!-- 状态 Badge（仅异常状态显示） -->
      <Badge v-if="currentModel!.isDeleted" variant="destructive" class="text-white">
        {{ t('chat.deleted') }}
      </Badge>
      <Badge v-else-if="!currentModel!.isEnable" variant="secondary" class="bg-orange-500 text-white">
        {{ t('chat.disabled') }}
      </Badge>
    </div>
  </Tooltip>
</template>

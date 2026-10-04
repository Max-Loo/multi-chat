<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isNil } from 'es-toolkit';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProviderLogo } from '@/components/ProviderLogo';
import { useModelsStore } from '@/store/models';
import type { ChatModel } from '@/types/chat';

/**
 * 聊天面板标题属性
 */
interface DetailTitleProps {
  /** 当前窗口的聊天模型配置 */
  chatModel: ChatModel;
}

const props = defineProps<DetailTitleProps>();

const { t } = useTranslation();
const modelsStore = useModelsStore();

// 当前展示的模型在模型列表里面的完整版
const currentModel = computed(() =>
  modelsStore.models.find((model) => model.id === props.chatModel.modelId),
);

// 显示名称：昵称非空时显示「昵称 (模型名)」，否则仅显示模型名
const displayName = computed(() => {
  const model = currentModel.value;
  if (!model) return '';
  return model.nickname ? `${model.nickname} (${model.modelName})` : model.modelName;
});

/** 状态是否为已删除 */
const isDeletedModel = computed(() => currentModel.value?.isDeleted === true);
/** 状态是否为已禁用 */
const isDisabledModel = computed(
  () => !isDeletedModel.value && currentModel.value?.isEnable === false,
);
</script>

<!-- 聊天窗口标题：模型标识 + 状态标签 + 详情 Tooltip -->
<template>
  <!-- 模型不存在时显示错误提示 -->
  <Badge v-if="isNil(currentModel)" variant="destructive">
    {{ t('chat.modelDeleted') }}
  </Badge>

  <TooltipProvider v-else>
    <Tooltip>
      <TooltipTrigger as-child>
        <div class="flex items-center gap-2 min-w-0 cursor-default">
          <ProviderLogo
            :provider-key="currentModel!.providerKey"
            :provider-name="currentModel!.providerName"
            :size="24"
          />
          <h3 class="truncate">{{ displayName }}</h3>
          <!-- 状态 Badge（仅异常状态显示） -->
          <Badge v-if="isDeletedModel" variant="destructive" class="text-white">
            {{ t('chat.deleted') }}
          </Badge>
          <Badge
            v-else-if="isDisabledModel"
            variant="secondary"
            class="bg-orange-500 text-white"
          >
            {{ t('chat.disabled') }}
          </Badge>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div class="space-y-1">
          <div>{{ t('chat.supplier') }}: {{ currentModel!.providerName }}</div>
          <div>{{ t('chat.model') }}: {{ currentModel!.modelName }}</div>
          <div>{{ t('chat.nickname') }}: {{ currentModel!.nickname || '-' }}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

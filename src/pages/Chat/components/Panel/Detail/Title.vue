<script setup lang="ts">
/**
 * 聊天面板单格标题（对应旧版 Panel/Detail/Title.tsx）
 * 显示模型名称、供应商 Logo 与状态徽章
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProviderLogo } from '@/components/ProviderLogo';
import { useModelStore } from '@/stores';
import { useTranslation } from '@/composables/useTranslation';
import type { ChatModel } from '@/types/chat';
import { isNil } from 'es-toolkit';

/** 组件属性 */
const props = defineProps<{ chatModel: ChatModel }>();

const { t } = useTranslation();
const modelStore = useModelStore();
const { models } = storeToRefs(modelStore);

// 当前展示的模型在模型列表里面的完整版
const currentModel = computed(() =>
  models.value.find((model) => model.id === props.chatModel.modelId),
);

// 显示名称：昵称非空时显示「昵称 (模型名)」，否则仅显示模型名
const displayName = computed(() => {
  if (!currentModel.value) return '';
  return currentModel.value.nickname
    ? `${currentModel.value.nickname} (${currentModel.value.modelName})`
    : currentModel.value.modelName;
});

// 状态徽章类型（仅异常状态显示）
const statusVariant = computed<'destructive' | 'secondary' | null>(() => {
  if (!currentModel.value) return null;
  if (currentModel.value.isDeleted) return 'destructive';
  if (!currentModel.value.isEnable) return 'secondary';
  return null;
});

/** 状态徽章类名 */
const statusClass = computed(() => {
  if (statusVariant.value === 'secondary') return 'bg-orange-500 text-white';
  if (statusVariant.value === 'destructive') return 'text-white';
  return '';
});

const hasModel = computed(() => !isNil(currentModel.value));
</script>

<template>
  <!-- 模型不存在时显示错误提示 -->
  <Badge v-if="!hasModel" variant="destructive">
    {{ t('chat.modelDeleted') }}
  </Badge>

  <TooltipProvider v-else>
    <Tooltip>
      <TooltipTrigger as-child>
        <div class="flex min-w-0 cursor-default items-center gap-2">
          <ProviderLogo
            :provider-key="currentModel!.providerKey"
            :provider-name="currentModel!.providerName"
            :size="24"
          />
          <h3 class="truncate">{{ displayName }}</h3>
          <Badge
            v-if="statusVariant"
            :variant="statusVariant"
            :class="statusClass"
          >
            {{
              statusVariant === 'destructive'
                ? t('chat.deleted')
                : t('chat.disabled')
            }}
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

<script setup lang="ts">
/**
 * 单个供应商卡片组件（对应旧版 ProviderCard.tsx）
 * 显示供应商名称、状态、模型数量等信息
 */
import { Card } from '@/components/ui/card';
import ProviderCardHeader from './ProviderCardHeader.vue';
import ProviderCardSummary from './ProviderCardSummary.vue';
import ProviderCardDetails from './ProviderCardDetails.vue';
import { handleActivationKeyDown } from '@/utils/a11y';
import type { RemoteProviderData } from '@/services/modelRemote';

/** 组件属性 */
const props = defineProps<{
  /** 供应商数据 */
  provider: RemoteProviderData;
  /** 是否展开 */
  isExpanded: boolean;
  /** 供应商状态（可用/不可用） */
  status: 'available' | 'unavailable';
}>();

/** 展开/折叠事件 */
const emit = defineEmits<{ 'toggle-provider': [] }>();

/** 切换展开 */
const onToggle = (): void => {
  emit('toggle-provider');
};

/** 键盘激活回调 */
const activationKeydown = handleActivationKeyDown(onToggle);
</script>

<template>
  <Card
    data-testid="provider-card"
    :tabindex="0"
    :aria-expanded="props.isExpanded"
    class="cursor-pointer overflow-hidden transition-all hover:shadow-md"
    :style="{ willChange: 'transform, opacity' }"
    @click="onToggle"
    @keydown="activationKeydown"
  >
    <div class="space-y-3 p-4">
      <ProviderCardHeader
        :provider-name="props.provider.providerName"
        :provider-key="props.provider.providerKey"
        :status="props.status"
        :is-expanded="props.isExpanded"
      />
      <ProviderCardSummary
        :model-count="props.provider.models.length"
        :is-expanded="props.isExpanded"
      />
    </div>
    <div v-if="props.isExpanded" data-testid="provider-card-details" class="border-t">
      <ProviderCardDetails :provider="props.provider" />
    </div>
  </Card>
</template>

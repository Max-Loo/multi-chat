<script setup lang="ts">
import { Card } from '@/components/ui/card';
import type { RemoteProviderData } from '@/services/modelRemote';
import ProviderCardHeader from './ProviderCardHeader.vue';
import ProviderCardSummary from './ProviderCardSummary.vue';
import ProviderCardDetails from './ProviderCardDetails.vue';
import { handleActivationKeyDown } from '@/utils/a11y';

/**
 * 单个供应商卡片组件属性
 */
interface ProviderCardProps {
  /** 供应商数据 */
  provider: RemoteProviderData;
  /** 是否展开 */
  isExpanded: boolean;
  /** 供应商状态（可用/不可用） */
  status: 'available' | 'unavailable';
}

const props = defineProps<ProviderCardProps>();

const emit = defineEmits<{
  /** 展开/折叠回调 */
  (e: 'toggle'): void;
}>();
</script>

<!--
  单个供应商卡片组件
  显示供应商名称、状态、模型数量等信息
-->
<template>
  <Card
    data-testid="provider-card"
    tabindex="0"
    :aria-expanded="props.isExpanded"
    class="overflow-hidden transition-all hover:shadow-md cursor-pointer will-change-[transform,opacity]"
    @click="emit('toggle')"
    @keydown="handleActivationKeyDown(() => emit('toggle'))($event)"
  >
    <div class="p-4 space-y-3">
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

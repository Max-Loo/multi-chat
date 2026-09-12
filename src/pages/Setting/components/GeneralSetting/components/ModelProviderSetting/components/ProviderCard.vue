<script setup lang="ts">
/**
 * 单个供应商卡片组件（Vue 版 ProviderCard）
 * 显示供应商名称、状态、模型数量等信息；点击或回车/空格切换展开状态
 */
import { Card } from '@/components/ui-vue/card';
import type { RemoteProviderData } from '@/services/modelRemote';
import ProviderCardHeader from './ProviderCardHeader.vue';
import ProviderCardSummary from './ProviderCardSummary.vue';
import ProviderCardDetails from './ProviderCardDetails.vue';

defineProps<{
  /** 供应商数据 */
  provider: RemoteProviderData;
  /** 是否展开 */
  isExpanded: boolean;
  /** 供应商状态（可用/不可用） */
  status: 'available' | 'unavailable';
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
}>();

/** 切换展开状态 */
const handleToggle = () => {
  emit('toggle');
};

/**
 * 键盘激活（Enter/空格），行为与 React 版 handleActivationKeyDown 一致
 * @param e 键盘事件
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleToggle();
  }
};
</script>

<template>
  <Card
    data-testid="provider-card"
    class="cursor-pointer overflow-hidden transition-all hover:shadow-md"
    style="will-change: transform, opacity"
    :tabindex="0"
    :aria-expanded="isExpanded"
    @click="handleToggle"
    @keydown="handleKeyDown"
  >
    <div class="space-y-3 p-4">
      <ProviderCardHeader
        :provider-name="provider.providerName"
        :provider-key="provider.providerKey"
        :status="status"
        :is-expanded="isExpanded"
      />
      <ProviderCardSummary
        :model-count="provider.models.length"
        :is-expanded="isExpanded"
      />
    </div>
    <div v-if="isExpanded" data-testid="provider-card-details" class="border-t">
      <ProviderCardDetails :provider="provider" />
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Avatar } from '@/components/ui/avatar';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { useModelProviderStore } from '@/store/modelProvider';
import { getProviderLogoUrl } from '@/utils/providerUtils';

/**
 * 大模型服务商展示组件属性
 */
interface ModelProviderDisplayProps {
  /** 供应商唯一标识 */
  providerKey: ModelProviderKeyEnum;
}

const props = defineProps<ModelProviderDisplayProps>();

/** 当前展示的供应商完整信息 */
const provider = computed(() =>
  useModelProviderStore().providers.find(
    (p) => p.providerKey === props.providerKey,
  ),
);
</script>

<!-- 大模型服务商展示组件 -->
<template>
  <span v-if="!provider">{{ providerKey }}</span>
  <div v-else class="flex items-center gap-2" data-testid="provider-display">
    <Avatar class="h-6 w-6" data-testid="provider-avatar">
      <img
        :src="getProviderLogoUrl(provider.providerKey)"
        :alt="provider.providerName"
      />
    </Avatar>
    <span>{{ provider.providerName }}</span>
  </div>
</template>

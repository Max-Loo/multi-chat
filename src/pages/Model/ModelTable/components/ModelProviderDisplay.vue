<script setup lang="ts">
/**
 * 大模型服务商展示组件（对应旧版 ModelProviderDisplay.tsx）
 */
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { Avatar } from '@/components/ui/avatar';
import { useModelProviderStore } from '@/stores';
import { getProviderLogoUrl } from '@/utils/providerUtils';
import type { ModelProviderKeyEnum } from '@/utils/enums';

/** 组件属性 */
const props = defineProps<{
  providerKey: ModelProviderKeyEnum;
}>();

const providerStore = useModelProviderStore();
const { providers } = storeToRefs(providerStore);

// 当前供应商数据
const provider = computed(() =>
  providers.value.find((p) => p.providerKey === props.providerKey),
);
</script>

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

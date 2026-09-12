<script setup lang="ts">
/**
 * 大模型服务商展示组件（Vue 版 ModelProviderDisplay）
 * 根据供应商 Key 从供应商 Store 中查找并展示 Logo 与名称，找不到时回退显示原始 Key
 */
import { computed } from 'vue';
import { Avatar } from '@/components/ui-vue/avatar';
import { useModelProviderStore } from '@/store/pinia/modelProvider';
import { getProviderLogoUrl } from '@/utils/providerUtils';
import type { ModelProviderKeyEnum } from '@/utils/enums';

const props = defineProps<{ providerKey: ModelProviderKeyEnum }>();

const providerStore = useModelProviderStore();

// 当前供应商 Key 对应的供应商数据
const provider = computed(() =>
  providerStore.providers.find((p) => p.providerKey === props.providerKey),
);
</script>

<template>
  <span v-if="!provider">{{ props.providerKey }}</span>

  <div v-else class="flex items-center gap-2" data-testid="provider-display">
    <Avatar class="h-6 w-6" data-testid="provider-avatar">
      <img :src="getProviderLogoUrl(props.providerKey)" :alt="provider.providerName" />
    </Avatar>
    <span>{{ provider.providerName }}</span>
  </div>
</template>

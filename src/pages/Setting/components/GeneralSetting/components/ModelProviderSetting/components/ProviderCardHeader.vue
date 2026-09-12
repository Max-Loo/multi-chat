<script setup lang="ts">
/**
 * 供应商卡片头部组件（Vue 版 ProviderCardHeader）
 * 显示供应商名称、状态图标、展开/折叠图标
 */
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { Badge } from '@/components/ui-vue/badge';
import ProviderLogo from '@/components/ProviderLogo/ProviderLogo.vue';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  /** 供应商名称 */
  providerName: string;
  /** 供应商唯一标识 */
  providerKey: string;
  /** 供应商状态 */
  status: 'available' | 'unavailable';
  /** 是否展开 */
  isExpanded: boolean;
}>();

const { t } = useTranslation();
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <ProviderLogo
        :provider-key="props.providerKey"
        :provider-name="props.providerName"
        :size="40"
      />
      <h3 class="text-lg font-semibold">{{ props.providerName }}</h3>
      <Badge
        v-if="props.status === 'available'"
        variant="outline"
        class="gap-1 border-green-600 text-green-600"
      >
        <CheckCircle class="h-3 w-3" />
        {{ t(($) => $.setting.modelProvider.status.available) }}
      </Badge>
      <Badge
        v-else
        variant="outline"
        class="gap-1 border-red-600 text-red-600"
      >
        <XCircle class="h-3 w-3" />
        {{ t(($) => $.setting.modelProvider.status.unavailable) }}
      </Badge>
    </div>
    <div class="text-muted-foreground">
      <ChevronUp v-if="props.isExpanded" class="h-5 w-5" />
      <ChevronDown v-else class="h-5 w-5" />
    </div>
  </div>
</template>

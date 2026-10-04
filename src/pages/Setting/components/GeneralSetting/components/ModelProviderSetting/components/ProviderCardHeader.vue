<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { Badge } from '@/components/ui/badge';
import { ProviderLogo } from '@/components/ProviderLogo';

/**
 * 供应商卡片头部组件属性
 */
interface ProviderCardHeaderProps {
  /** 供应商名称 */
  providerName: string;
  /** 供应商唯一标识 */
  providerKey: string;
  /** 供应商状态 */
  status: 'available' | 'unavailable';
  /** 是否展开 */
  isExpanded: boolean;
}

const props = defineProps<ProviderCardHeaderProps>();

const { t } = useTranslation();
</script>

<!-- 供应商卡片头部：名称、状态图标、展开/折叠图标 -->
<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <ProviderLogo
        :provider-key="props.providerKey"
        :provider-name="props.providerName"
        :size="40"
      />
      <h3 class="font-semibold text-lg">{{ props.providerName }}</h3>
      <Badge
        v-if="props.status === 'available'"
        variant="outline"
        class="gap-1 text-green-600 border-green-600"
      >
        <CheckCircle class="w-3 h-3" />
        {{ t('setting.modelProvider.status.available') }}
      </Badge>
      <Badge
        v-else
        variant="outline"
        class="gap-1 text-red-600 border-red-600"
      >
        <XCircle class="w-3 h-3" />
        {{ t('setting.modelProvider.status.unavailable') }}
      </Badge>
    </div>
    <div class="text-muted-foreground">
      <ChevronUp v-if="props.isExpanded" class="w-5 h-5" />
      <ChevronDown v-else class="w-5 h-5" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';

/**
 * 供应商卡片摘要组件属性
 */
interface ProviderCardSummaryProps {
  /** 模型数量 */
  modelCount: number;
  /** 是否展开 */
  isExpanded: boolean;
}

const props = defineProps<ProviderCardSummaryProps>();

const { t } = useTranslation();
</script>

<!-- 供应商卡片摘要：模型数量和提示信息 -->
<template>
  <div class="flex items-center justify-between text-sm text-muted-foreground">
    <span>{{ t('setting.modelProvider.modelCount', { count: props.modelCount }) }}</span>
    <span v-if="!props.isExpanded" class="text-xs">
      {{ t('setting.modelProvider.clickToViewDetails') }}
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * 供应商卡片摘要组件（Vue 版 ProviderCardSummary）
 * 显示模型数量和提示信息
 */
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  /** 模型数量 */
  modelCount: number;
  /** 是否展开 */
  isExpanded: boolean;
}>();

const { t } = useTranslation();
</script>

<template>
  <div class="flex items-center justify-between text-sm text-muted-foreground">
    <span>{{ t(($) => $.setting.modelProvider.modelCount, { count: props.modelCount }) }}</span>
    <span v-if="!props.isExpanded" class="text-xs">
      {{ t(($) => $.setting.modelProvider.clickToViewDetails) }}
    </span>
  </div>
</template>

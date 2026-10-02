<script setup lang="ts">
/**
 * 供应商卡片摘要组件（对应旧版 ProviderCardSummary.tsx）
 * 显示模型数量和提示信息
 */
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
defineProps<{
  /** 模型数量 */
  modelCount: number;
  /** 是否展开 */
  isExpanded: boolean;
}>();

const { t } = useTranslation();
</script>

<template>
  <div class="flex items-center justify-between text-sm text-muted-foreground">
    <span>{{ t('setting.modelProvider.modelCount', { count: modelCount }) }}</span>
    <span v-if="!isExpanded" class="text-xs">
      {{ t('setting.modelProvider.clickToViewDetails') }}
    </span>
  </div>
</template>

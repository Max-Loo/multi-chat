<script setup lang="ts">
/**
 * 模型搜索组件（Vue 版 ModelSearch）
 * 提供搜索框和结果统计；防抖在父组件 ProviderCardDetails 中实现
 */
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui-vue/input';
import { useTranslation } from '@/composables/useTranslation';

const props = defineProps<{
  /** 搜索框值 */
  value: string;
  /** 搜索结果数量 */
  resultCount: number;
  /** 总模型数量 */
  totalCount: number;
}>();

const emit = defineEmits<{
  (e: 'change', value: string): void;
}>();

const { t } = useTranslation();
</script>

<template>
  <div class="space-y-2" data-testid="model-search-wrapper">
    <div class="relative" data-testid="model-search-container">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        data-testid="model-search-icon"
      />
      <Input
        type="text"
        :model-value="props.value"
        :placeholder="t(($) => $.setting.modelProvider.searchPlaceholder) as string"
        class="pl-9"
        @update:model-value="(v) => emit('change', String(v ?? ''))"
        @click.stop
      />
    </div>
    <div class="text-xs text-muted-foreground">
      <span v-if="props.value.trim()">
        {{ t(($) => $.setting.modelProvider.searchResult, { count: props.resultCount }) }}
      </span>
      <span v-else>
        {{ t(($) => $.setting.modelProvider.totalModels, { count: props.totalCount }) }}
      </span>
    </div>
  </div>
</template>

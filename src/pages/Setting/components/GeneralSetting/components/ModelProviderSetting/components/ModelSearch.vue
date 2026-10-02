<script setup lang="ts">
/**
 * 模型搜索组件（对应旧版 ModelSearch.tsx）
 * 提供搜索框和结果统计（防抖在父组件 ProviderCardDetails 中实现）
 */
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
defineProps<{
  /** 搜索框值 */
  modelValue: string;
  /** 搜索结果数量 */
  resultCount: number;
  /** 总模型数量 */
  totalCount: number;
}>();

/** 值变化事件 */
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useTranslation();

/** 输入处理 */
const handleInput = (e: Event): void => {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
};
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
        :placeholder="t('setting.modelProvider.searchPlaceholder')"
        :model-value="modelValue"
        class="pl-9"
        data-testid="model-search-input"
        @input="handleInput"
        @click.stop
      />
    </div>
    <div class="text-xs text-muted-foreground">
      <span v-if="modelValue.trim()">
        {{ t('setting.modelProvider.searchResult', { count: resultCount }) }}
      </span>
      <span v-else>
        {{ t('setting.modelProvider.totalModels', { count: totalCount }) }}
      </span>
    </div>
  </div>
</template>

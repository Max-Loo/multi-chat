<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';

/**
 * 模型搜索组件属性
 */
interface ModelSearchProps {
  /** 当前搜索词 */
  value: string;
  /** 过滤后的结果数量 */
  resultCount: number;
  /** 模型总数 */
  totalCount: number;
}

const props = defineProps<ModelSearchProps>();

const emit = defineEmits<{
  /** 输入变化（防抖在父组件实现） */
  (e: 'change', value: string): void;
}>();

const { t } = useTranslation();

/** 是否处于搜索状态（有非空输入） */
const isSearching = computed(() => props.value.trim().length > 0);

/**
 * 输入处理
 * @param e 输入事件
 */
function handleInput(e: Event): void {
  emit('change', (e.target as HTMLInputElement).value);
}
</script>

<!-- 模型搜索：搜索框和结果统计 -->
<template>
  <div class="space-y-2" data-testid="model-search-wrapper">
    <div class="relative" data-testid="model-search-container">
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
        data-testid="model-search-icon"
      />
      <Input
        type="text"
        :placeholder="t('setting.modelProvider.searchPlaceholder')"
        :model-value="props.value"
        class="pl-9"
        @click.stop
        @input="handleInput"
      />
    </div>
    <div class="text-xs text-muted-foreground">
      <span v-if="isSearching">
        {{ t('setting.modelProvider.searchResult', { count: props.resultCount }) }}
      </span>
      <span v-else>
        {{ t('setting.modelProvider.totalModels', { count: props.totalCount }) }}
      </span>
    </div>
  </div>
</template>

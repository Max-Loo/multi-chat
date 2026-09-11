<script setup lang="ts">
/**
 * 过滤器输入组件（Vue 版 FilterInput）
 * 带搜索图标的过滤输入框，行为与 React 版保持一致
 */
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui-vue/input';
import { useTranslation } from '@/composables/useTranslation';

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    autoFocus?: boolean;
    class?: string;
  }>(),
  { autoFocus: false },
);

const model = defineModel<string>();

const { t } = useTranslation();

// 如果没有传入 placeholder，则使用默认的国际化文本
const finalPlaceholder = props.placeholder || (t('common.search') as string);
</script>

<template>
  <div :class="`relative flex items-center ${props.class ?? ''}`">
    <Search class="absolute left-3 h-4 w-4 text-gray-400" />
    <Input
      v-model="model"
      data-testid="filter-input"
      :placeholder="finalPlaceholder"
      class="pl-9"
      :autofocus="props.autoFocus"
    />
  </div>
</template>

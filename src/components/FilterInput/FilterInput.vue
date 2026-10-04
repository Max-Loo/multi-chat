<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { Search } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';

/**
 * 过滤器输入组件属性
 */
interface FilterInputProps {
  /** 输入值（v-model） */
  modelValue?: string;
  /** 占位文本；缺省时使用国际化默认文本 */
  placeholder?: string;
  /** 是否自动聚焦 */
  autoFocus?: boolean;
}

const props = withDefaults(defineProps<FilterInputProps>(), {
  modelValue: '',
  autoFocus: false,
});

const emit = defineEmits<{
  /** 输入值变化 */
  (e: 'update:modelValue', value: string): void;
}>();

const { t } = useTranslation();

// 如果没有传入 placeholder，则使用默认的国际化文本
const finalPlaceholder = computed(
  () => props.placeholder || t('common.search'),
);
</script>

<!-- 过滤器输入组件 -->
<template>
  <div class="relative flex items-center">
    <Search class="absolute left-3 h-4 w-4 text-gray-400" />
    <Input
      data-testid="filter-input"
      :placeholder="finalPlaceholder"
      :model-value="props.modelValue"
      class="pl-9"
      :auto-focus="props.autoFocus"
      @update:model-value="(value: string | number) => emit('update:modelValue', String(value))"
    />
  </div>
</template>

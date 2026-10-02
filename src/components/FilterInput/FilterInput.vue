<script setup lang="ts">
/**
 * 过滤器输入组件（对应旧版 FilterInput/index.tsx）
 */
import { computed } from 'vue';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-vue-next';
import { useTranslation } from '@/composables/useTranslation';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 输入值（v-model） */
    modelValue?: string;
    /** 占位文本 */
    placeholder?: string;
    /** 自动聚焦 */
    autoFocus?: boolean;
    /** 自定义类名 */
    className?: string;
  }>(),
  { modelValue: '', placeholder: undefined, autoFocus: false, className: '' },
);

const emit = defineEmits<{
  /** 输入值变化 */
  'update:modelValue': [value: string];
}>();

const { t } = useTranslation();

// 如果没有传入 placeholder，则使用默认的国际化文本
const finalPlaceholder = computed(
  () => props.placeholder || t('common.search'),
);

/** 输入处理 */
const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>

<template>
  <div :class="`relative flex items-center ${className}`">
    <Search class="absolute left-3 h-4 w-4 text-gray-400" />
    <Input
      data-testid="filter-input"
      :placeholder="finalPlaceholder"
      :model-value="modelValue"
      :autofocus="autoFocus"
      class="pl-9"
      @input="handleInput"
    />
  </div>
</template>

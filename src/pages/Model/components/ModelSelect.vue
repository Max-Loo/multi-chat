<script setup lang="ts">
/**
 * 具体模型的选择器（Vue 版 ModelSelect）
 * 以单选组形式展示供应商下的可配置模型，校验出错时边框标红
 */
import { RadioGroup, RadioGroupItem } from '@/components/ui-vue/radio-group';
import type { ModelDetail } from '@/types/model';

const props = defineProps<{
  // 当前选择的模型的标识
  value?: string;
  // 可选项
  options: ModelDetail[];
  // 表单校验错误信息（出错时边框标红，与 React 版 useFormField 行为一致）
  error?: string;
  class?: string;
}>();

const model = defineModel<string>();

/** 选中值变化时向表单回传 */
const emit = defineEmits<{ (e: 'change', value: string): void }>();
</script>

<template>
  <RadioGroup
    :model-value="model"
    :class="`
      flex flex-col rounded-md border border-gray-300
      ${props.error ? 'border-red-500' : ''}
      ${props.class ?? ''}
    `"
    @update:model-value="
      (value) => {
        model = value as string;
        emit('change', value as string);
      }
    "
  >
    <div
      v-for="option in props.options"
      :key="option.modelKey"
      class="flex items-center space-x-2 border-b border-gray-200 p-2 last:border-0"
    >
      <RadioGroupItem :value="option.modelKey" :id="option.modelKey" />
      <label
        :for="option.modelKey"
        :data-testid="`model-option-${option.modelKey}`"
        class="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {{ option.modelName }}
      </label>
    </div>
  </RadioGroup>
</template>

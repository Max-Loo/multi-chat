<script setup lang="ts">
/**
 * 具体模型的选择器（对应旧版 Model/components/ModelSelect.tsx）
 * 表单内使用的单选组
 */
import { computed } from 'vue';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFormField } from '@/components/ui/form';
import type { ModelDetail } from '@/types/model';

/** 组件属性 */
const props = withDefaults(
  defineProps<{
    /** 当前选择的模型的标识 */
    modelValue?: string;
    /** 可选项 */
    options: ModelDetail[];
    /** 自定义类名 */
    className?: string;
  }>(),
  { modelValue: undefined, className: '' },
);

const emit = defineEmits<{
  /** 选中值变化 */
  'update:modelValue': [value: string];
}>();

// 处理校验时的报错相关信息
const { error } = useFormField();

/** 选中值变化的回调（Reka 值类型为 AcceptableValue，此处收敛为 string） */
const onValueChange = (newValue: unknown): void => {
  emit('update:modelValue', String(newValue));
};

const groupClass = computed(
  () => `
    flex flex-col rounded-md border border-gray-300
    ${error.value ? 'border-red-500' : ''}
    ${props.className}
  `,
);
</script>

<template>
  <RadioGroup :model-value="modelValue" :class="groupClass" @update:model-value="onValueChange">
    <div
      v-for="option in options"
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

<script setup lang="ts">
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ModelDetail } from '@/types/model';

/**
 * 具体模型的选择器属性
 */
interface ModelSelectProps {
  /** 当前选择的模型的标识 */
  value?: string;
  /** 可选项 */
  options: ModelDetail[];
  /** 校验错误信息（有错误时边框标红） */
  error?: string;
}

const props = defineProps<ModelSelectProps>();

const emit = defineEmits<{
  /** 选中的值发生改变 */
  (e: 'update:value', value: string): void;
}>();
</script>

<!-- 具体模型的选择器 -->
<template>
  <RadioGroup
    :model-value="props.value"
    :class="[
      'flex flex-col border rounded-md border-gray-300',
      props.error ? 'border-red-500' : '',
    ]"
    @update:model-value="(value: unknown) => emit('update:value', String(value))"
  >
    <div
      v-for="option in props.options"
      :key="option.modelKey"
      class="flex items-center space-x-2 p-2 border-b border-gray-200 last:border-0"
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

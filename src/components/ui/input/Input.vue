<script setup lang="ts">
/**
 * 输入框组件（对应旧版 input.tsx）
 * 支持 v-model；其余 attrs（事件、data-* 等）自动透传到原生 input 元素
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

/** 输入框组件 props */
const props = withDefaults(
  defineProps<{
    /** 输入值（v-model） */
    modelValue?: string | number | readonly string[];
    /** 输入类型 */
    type?: string;
    /** 自定义类名 */
    class?: HTMLAttributes['class'];
  }>(),
  { modelValue: undefined, type: undefined },
);

const emit = defineEmits<{
  /** 输入值变化 */
  'update:modelValue': [value: string];
}>();

/** 合并输入框样式类 */
const classes = computed(() =>
  cn(
    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    props.class,
  ),
);

/** 输入处理：同步 v-model */
const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
};
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :class="classes"
    @input="handleInput"
  />
</template>

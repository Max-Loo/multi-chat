<script setup lang="ts">
/**
 * 多行文本输入组件（对应旧版 textarea.tsx）
 * 支持 v-model；其余 attrs（事件、data-* 等）自动透传到原生 textarea 元素
 */
import { computed, type HTMLAttributes } from 'vue';
import { cn } from '@/utils/utils';

/** 多行文本输入组件 props */
const props = withDefaults(
  defineProps<{
    /** 输入值（v-model） */
    modelValue?: string;
    /** 自定义类名 */
    class?: HTMLAttributes['class'];
  }>(),
  { modelValue: undefined },
);

const emit = defineEmits<{
  /** 输入值变化 */
  'update:modelValue': [value: string];
}>();

/** 合并文本域样式类 */
const classes = computed(() =>
  cn(
    'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
    props.class,
  ),
);

/** 输入处理：同步 v-model */
const handleInput = (event: Event): void => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
};
</script>

<template>
  <textarea :value="modelValue" :class="classes" @input="handleInput" />
</template>

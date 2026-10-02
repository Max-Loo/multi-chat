<script setup lang="ts">
/**
 * 标签组件（对应旧版 label.tsx）
 * 基于 Reka UI Label，自动关联表单控件
 */
import { computed } from 'vue';
import { Label as RekaLabel, type LabelProps } from 'reka-ui';
import { cn } from '@/utils/utils';

/** 标签组件 props */
const props = defineProps<
  LabelProps & {
    /** 自定义类名 */
    class?: HTMLAttributes['class'];
  }
>();

/** 合并标签样式类 */
const classes = computed(() =>
  cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    props.class,
  ),
);
</script>

<template>
  <RekaLabel v-bind="props" :class="classes">
    <slot />
  </RekaLabel>
</template>

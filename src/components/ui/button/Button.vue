<script setup lang="ts">
/**
 * 按钮组件（对应旧版 button.tsx）
 * 基于 Reka UI Primitive 支持 asChild 渲染合并语义
 */
import { computed } from 'vue';
import { Primitive } from 'reka-ui';
import { cn } from '@/utils/utils';
import { buttonVariants } from './buttonVariants';

/** 按钮组件 props（与旧版 ButtonProps 语义对齐） */
interface Props {
  /** 视觉变体 */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | null;
  /** 尺寸变体 */
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  /** 是否以子元素作为渲染根（Slot 模式） */
  asChild?: boolean;
  /** 自定义类名 */
  class?: HTMLAttributes['class'];
  /** 原生 button type，默认 button 防止表单误提交 */
  type?: 'button' | 'submit' | 'reset';
}

const props = withDefaults(defineProps<Props>(), {
  asChild: false,
  type: 'button',
});

/** 合并变体类与自定义类 */
const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
);
</script>

<template>
  <Primitive
    :as="asChild ? 'div' : 'button'"
    :as-child="asChild"
    :type="asChild ? undefined : type"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>

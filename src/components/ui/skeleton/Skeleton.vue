<script setup lang="ts">
/**
 * 骨架屏组件（对应旧版 skeleton.tsx）
 * 支持文本/圆形/矩形变体、pulse/wave 动画与尺寸预设
 */
import { computed } from 'vue';
import { cn } from '@/utils/utils';
import type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonAnimation,
} from './skeleton';

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: 'text',
  animation: 'pulse',
  size: undefined,
});

/** 变体样式映射 */
const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-md',
  circle: 'h-10 w-10 rounded-full',
  rect: 'h-24 w-full rounded-md',
};

/** 动画样式映射 */
const animationStyles: Record<Exclude<SkeletonAnimation, false>, string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
};

/** 尺寸预设映射（Tailwind h- 数值） */
const sizePresets: Record<Exclude<NonNullable<SkeletonProps['size']>, number>, number> = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

/**
 * 根据变体和尺寸生成样式类
 */
function getSizeClasses(variant: SkeletonVariant, size?: SkeletonProps['size']): string {
  if (!size) {
    return variantStyles[variant];
  }

  const sizeValue = typeof size === 'number' ? size : sizePresets[size];

  if (variant === 'circle') {
    return `h-${sizeValue} w-${sizeValue} rounded-full`;
  }

  return `h-${sizeValue} w-full rounded-md`;
}

/** 合并基础/尺寸/动画/自定义类 */
const classes = computed(() => {
  const baseStyles = 'bg-primary/10';
  const sizeClass = getSizeClasses(props.variant, props.size);
  const animationClass =
    props.animation === false ? '' : animationStyles[props.animation];
  return cn(baseStyles, sizeClass, animationClass, props.class);
});
</script>

<template>
  <div :class="classes" />
</template>

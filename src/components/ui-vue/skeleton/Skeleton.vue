<script setup lang="ts">
/**
 * Skeleton 骨架屏组件（Vue 版）
 * 支持形状变体（text/circle/rect）、动画（pulse/wave/无）与尺寸预设，
 * 行为与类名体系与 React 版 skeleton.tsx 保持一致
 */
import { computed } from 'vue';
import { cn } from '@/utils/utils';

type SkeletonVariant = 'text' | 'circle' | 'rect';
type SkeletonAnimation = 'pulse' | 'wave' | false;
type SkeletonSize = number | 'sm' | 'md' | 'lg' | 'xl';

const props = withDefaults(
  defineProps<{
    variant?: SkeletonVariant;
    animation?: SkeletonAnimation;
    size?: SkeletonSize;
    class?: string;
  }>(),
  { variant: 'text', animation: 'pulse' },
);

/** 变体样式映射 */
const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-md',
  circle: 'h-10 w-10 rounded-full',
  rect: 'h-24 w-full rounded-md',
};

/** 动画样式映射 */
const animationStyles: Record<'pulse' | 'wave', string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
};

/** 尺寸预设映射（Tailwind h- 数值） */
const sizePresets: Record<'sm' | 'md' | 'lg' | 'xl', number> = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

/** 根据变体和尺寸生成样式类 */
const sizeClasses = computed(() => {
  const { variant, size } = props;
  if (!size) {
    return variantStyles[variant];
  }

  const sizeValue = typeof size === 'number' ? size : sizePresets[size];

  if (variant === 'circle') {
    return `h-${sizeValue} w-${sizeValue} rounded-full`;
  }

  // text 和 rect 变体只设置高度，宽度保持 w-full
  return `h-${sizeValue} w-full rounded-md`;
});
</script>

<template>
  <div
    :class="cn(
      'bg-primary/10',
      sizeClasses,
      props.animation === false ? '' : animationStyles[props.animation],
      props.class,
    )"
  />
</template>

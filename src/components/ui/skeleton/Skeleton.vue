<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/utils/utils";
import type {
  SkeletonProps,
  SkeletonVariant,
  SkeletonAnimation,
} from "./types";

/** 变体样式映射 */
const variantStyles: Record<SkeletonVariant, string> = {
  text: "h-4 w-full rounded-md",
  circle: "h-10 w-10 rounded-full",
  rect: "h-24 w-full rounded-md",
};

/** 动画样式映射 */
const animationStyles: Record<Exclude<SkeletonAnimation, false>, string> = {
  pulse: "animate-pulse",
  wave: "animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
};

/** 尺寸预设映射（Tailwind h- 数值） */
const sizePresets: Record<"sm" | "md" | "lg" | "xl", number> = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

const props = withDefaults(defineProps<SkeletonProps>(), {
  variant: "text",
  animation: "pulse",
});

/**
 * 根据变体和尺寸生成样式类
 */
function getSizeClasses(
  variant: SkeletonVariant,
  size?: SkeletonProps["size"],
): string {
  if (!size) {
    // 使用默认变体样式
    return variantStyles[variant];
  }

  const sizeValue = typeof size === "number" ? size : sizePresets[size];

  if (variant === "circle") {
    return `h-${sizeValue} w-${sizeValue} rounded-full`;
  }

  // text 和 rect 变体只设置高度，宽度保持 w-full
  const heightClass = `h-${sizeValue}`;
  const widthClass = "w-full";
  const roundedClass = "rounded-md";

  return `${heightClass} ${widthClass} ${roundedClass}`;
}

/** 计算最终样式类 */
const classes = computed(() => {
  const baseStyles = "bg-primary/10";
  const sizeClass = getSizeClasses(props.variant, props.size);
  const animationClass =
    props.animation === false ? "" : animationStyles[props.animation];

  return cn(baseStyles, sizeClass, animationClass, props.class);
});
</script>

<template>
  <div data-slot="skeleton" :class="classes" />
</template>

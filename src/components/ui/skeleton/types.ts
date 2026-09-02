import type { HTMLAttributes } from "vue";

/** 骨架形状变体 */
export type SkeletonVariant = "text" | "circle" | "rect";

/** 动画效果类型 */
export type SkeletonAnimation = "pulse" | "wave" | false;

/**
 * 骨架屏组件属性
 */
export interface SkeletonProps {
  /** 骨架形状变体 */
  variant?: SkeletonVariant;
  /** 动画效果 */
  animation?: SkeletonAnimation;
  /**
   * 尺寸大小（支持数字或 Tailwind 尺寸类）
   * - circle: 设置宽高相同的尺寸（如 8, 10, 12 对应 h-8 w-8）
   * - text/rect: 设置高度（宽度默认为 w-full）
   */
  size?: number | "sm" | "md" | "lg" | "xl";
  /** 自定义类名 */
  class?: HTMLAttributes["class"];
}

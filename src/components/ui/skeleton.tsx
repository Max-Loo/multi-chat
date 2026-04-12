import { cn } from "@/utils/utils"

/**
 * Skeleton 组件变体类型
 */
type SkeletonVariant = 'text' | 'circle' | 'rect'

/**
 * Skeleton 组件动画类型
 */
type SkeletonAnimation = 'pulse' | 'wave' | false

/**
 * Skeleton 组件属性
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 骨架形状变体 */
  variant?: SkeletonVariant
  /** 动画效果 */
  animation?: SkeletonAnimation
  /**
   * 尺寸大小（支持数字或 Tailwind 尺寸类）
   * - circle: 设置宽高相同的尺寸（如 8, 10, 12 对应 h-8 w-8）
   * - text/rect: 设置高度（宽度默认为 w-full）
   */
  size?: number | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * 变体样式映射
 */
const variantStyles: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded-md',
  circle: 'h-10 w-10 rounded-full',
  rect: 'h-24 w-full rounded-md',
}

/**
 * 动画样式映射
 */
const animationStyles: Record<Exclude<SkeletonAnimation, false>, string> = {
  pulse: 'animate-pulse',
  wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
}

/**
 * 尺寸预设映射（Tailwind h- 数值）
 */
const sizePresets: Record<Exclude<SkeletonProps['size'], number | undefined>, number> = {
  sm: 8,   // h-8 w-8 或 h-8
  md: 10,  // h-10 w-10 或 h-10
  lg: 12,  // h-12 w-12 或 h-12
  xl: 16,  // h-16 w-16 或 h-16
}

/**
 * 根据变体和尺寸生成样式类
 */
function getSizeClasses(variant: SkeletonVariant, size?: SkeletonProps['size']): string {
  if (!size) {
    // 使用默认变体样式
    return variantStyles[variant]
  }

  const sizeValue = typeof size === 'number' ? size : sizePresets[size]

  if (variant === 'circle') {
    return `h-${sizeValue} w-${sizeValue} rounded-full`
  }

  // text 和 rect 变体只设置高度，宽度保持默认或从变体获取
  const heightClass = `h-${sizeValue}`
  const widthClass = variant === 'rect' ? 'w-full' : 'w-full'
  const roundedClass = variant === 'rect' ? 'rounded-md' : 'rounded-md'

  return `${heightClass} ${widthClass} ${roundedClass}`
}

/**
 * Skeleton 骨架屏组件
 *
 * 用于显示内容加载中的占位效果，支持多种形状变体和动画效果
 *
 * @example
 * // 文本骨架（默认）
 * <Skeleton />
 *
 * @example
 * // 圆形骨架（头像）
 * <Skeleton variant="circle" />
 *
 * @example
 * // 矩形骨架（卡片）
 * <Skeleton variant="rect" />
 *
 * @example
 * // 波浪动画
 * <Skeleton animation="wave" />
 *
 * @example
 * // 无动画
 * <Skeleton animation={false} />
 *
 * @example
 * // 自定义尺寸
 * <Skeleton variant="circle" size="lg" />
 * <Skeleton variant="circle" size={20} />
 */
function Skeleton({
  className,
  variant = 'text',
  animation = 'pulse',
  size,
  ...props
}: SkeletonProps) {
  const baseStyles = 'bg-primary/10'
  const sizeClass = getSizeClasses(variant, size)
  const animationClass = animation === false ? '' : animationStyles[animation]

  return (
    <div
      className={cn(baseStyles, sizeClass, animationClass, className)}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps, SkeletonVariant, SkeletonAnimation }

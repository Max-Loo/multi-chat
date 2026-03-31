import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/utils';

/**
 * SkeletonList 组件属性
 */
interface SkeletonListProps {
  /** 列表项数量 */
  count?: number;
  /** 每项的高度 */
  itemHeight?: string;
  /** 项之间的间距 */
  gap?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 列表骨架屏组件
 *
 * 渲染指定数量的骨架列表项
 *
 * @example
 * // 默认 5 个列表项
 * <SkeletonList />
 *
 * @example
 * // 自定义数量和高度
 * <SkeletonList count={10} itemHeight="h-16" gap="gap-4" />
 */
function SkeletonList({
  count = 5,
  itemHeight = 'h-12',
  gap = 'gap-3',
  className,
}: SkeletonListProps) {
  return (
    <div className={cn('flex flex-col', gap, className)}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} variant="text" className={itemHeight} />
      ))}
    </div>
  );
}

export { SkeletonList };
export type { SkeletonListProps };

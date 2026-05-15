import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";

/**
 * SkeletonMessage 组件属性
 */
interface SkeletonMessageProps {
  /** 是否为当前用户发送的消息（决定布局方向） */
  isSelf?: boolean;
  /** 消息行数 */
  lines?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 聊天消息骨架屏组件
 *
 * 模拟聊天消息的结构（头像 + 多行文本）
 *
 * @example
 * // 对方消息（默认）
 * <SkeletonMessage />
 *
 * @example
 * // 自己的消息（右侧布局）
 * <SkeletonMessage isSelf={true} />
 *
 * @example
 * // 自定义行数
 * <SkeletonMessage lines={5} />
 */
function SkeletonMessage({
  isSelf = false,
  lines = 3,
  className,
}: SkeletonMessageProps) {
  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isSelf ? "flex-row-reverse" : "flex-row",
        className,
      )}
      aria-hidden="true"
    >
      {/* 头像骨架 */}
      <Skeleton variant="circle" className="w-10 h-10 shrink-0" />

      {/* 消息内容骨架 */}
      <div
        className={cn(
          "flex flex-col gap-2 max-w-[70%]",
          isSelf ? "items-end" : "items-start",
        )}
      >
        {/* 用户名 */}
        <Skeleton variant="text" className="w-20 h-3" />

        {/* 消息文本行 */}
        <div
          className={cn(
            "flex flex-col gap-2",
            isSelf ? "items-end" : "items-start",
          )}
          style={{ width: "100%" }}
        >
          {Array.from({ length: lines }).map((_, index) => (
            <Skeleton
              key={index}
              variant="text"
              className={cn(
                "h-4",
                // 最后一行可能较短
                index === lines - 1 ? "w-2/3" : "w-full",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export { SkeletonMessage };
export type { SkeletonMessageProps };

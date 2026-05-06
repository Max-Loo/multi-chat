import { useRef, useMemo, memo } from "react";
import { generateCleanHtml } from "@/utils/markdown";
import { findSafeSplitPoint } from "@/utils/markdownSplit";

/**
 * 冻结块子组件 — 用 memo 阻止 React 对已冻结内容做 reconciliation
 */
const FrozenBlock = memo(function FrozenBlock({
  html,
}: {
  html: string;
}) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});

/**
 * 流式内容渲染组件的属性接口
 */
interface StreamingContentProps {
  /** markdown 内容 */
  content: string;
  /** 是否正在流式生成中 */
  isRunning: boolean;
  /** 外层容器的 className */
  className?: string;
}

/**
 * 流式内容增量渲染组件
 *
 * 流式期间将内容按段落边界分割为冻结块和活跃块：
 * - 冻结块渲染一次后不再重新渲染（HTML 缓存在 append-only 数组中，FrozenBlock 用 memo 跳过 reconciliation）
 * - 活跃块每次内容更新时重新渲染（内容短，开销小）
 * - 流式结束后执行一次完整渲染确保视觉正确性
 *
 * 重置机制：
 * - 父组件通过 React key 变化触发组件重新挂载，自动清空缓存
 * - 内容缩短时（编辑回退/重新生成）自动重置冻结块缓存
 */
export const StreamingContent: React.FC<StreamingContentProps> = ({
  content,
  isRunning,
  className,
}) => {
  const frozenBlocksRef = useRef<string[]>([]);
  const prevSplitPointRef = useRef(0);
  const lastAppendedStartRef = useRef(-1);

  const fullHtml = useMemo(() => {
    if (isRunning) return "";
    return generateCleanHtml(content);
  }, [content, isRunning]);

  const { frozenBlocks, activeStart } = useMemo(() => {
    if (!isRunning) {
      prevSplitPointRef.current = 0;
      return { frozenBlocks: [] as string[], activeStart: 0 };
    }

    const splitPoint = findSafeSplitPoint(content);
    const prevSplit = prevSplitPointRef.current;

    if (splitPoint < prevSplit) {
      prevSplitPointRef.current = 0;
      return { frozenBlocks: [] as string[], activeStart: 0 };
    }

    if (splitPoint === prevSplit) {
      return { frozenBlocks: [] as string[], activeStart: prevSplit };
    }

    const newBlock = generateCleanHtml(content.slice(prevSplit, splitPoint));
    prevSplitPointRef.current = splitPoint;
    return { frozenBlocks: [newBlock], activeStart: splitPoint };
  }, [content, isRunning]);

  if (activeStart === 0 && frozenBlocksRef.current.length > 0) {
    frozenBlocksRef.current = [];
    lastAppendedStartRef.current = -1;
  }

  if (frozenBlocks.length > 0 && activeStart !== lastAppendedStartRef.current) {
    frozenBlocksRef.current.push(...frozenBlocks);
    lastAppendedStartRef.current = activeStart;
  }

  if (!isRunning) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: fullHtml }}
      />
    );
  }

  const activeContent = content.slice(activeStart);
  const activeHtml = generateCleanHtml(activeContent);

  return (
    <div className={className}>
      {frozenBlocksRef.current.map((html, i) => (
        <FrozenBlock key={i} html={html} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: activeHtml }} />
    </div>
  );
};

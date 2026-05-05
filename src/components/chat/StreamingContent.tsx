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
  /** 冻结块 HTML 缓存（append-only，仅在新分割点出现时追加） */
  const frozenBlocksRef = useRef<string[]>([]);
  /** 上一次记录的分割点位置（用于检测分割点前进/回退） */
  const lastSplitPointRef = useRef(0);

  // 非流式模式的完整 HTML（memo 避免历史消息重复计算）
  const fullHtml = useMemo(() => {
    if (isRunning) return "";
    return generateCleanHtml(content);
  }, [content, isRunning]);

  // 流式期间：根据分割点变化更新冻结块缓存
  if (isRunning) {
    const splitPoint = findSafeSplitPoint(content);
    const lastSplit = lastSplitPointRef.current;

    if (splitPoint < lastSplit) {
      // 内容缩短（编辑回退/重新生成），重置缓存
      frozenBlocksRef.current = [];
      lastSplitPointRef.current = 0;
    } else if (splitPoint > lastSplit) {
      // 新安全分割点出现，将新确认的内容毕业为冻结块
      const newFrozenContent = content.slice(lastSplit, splitPoint);
      frozenBlocksRef.current = [
        ...frozenBlocksRef.current,
        generateCleanHtml(newFrozenContent),
      ];
      lastSplitPointRef.current = splitPoint;
    }
  } else if (frozenBlocksRef.current.length > 0) {
    // 流式结束 → 清除冻结缓存，下次渲染走 fullHtml 路径
    frozenBlocksRef.current = [];
    lastSplitPointRef.current = 0;
  }

  // 非流式：单次完整渲染
  if (!isRunning) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: fullHtml }}
      />
    );
  }

  // 流式：冻结块（memo 跳过） + 活跃块
  const activeContent = content.slice(lastSplitPointRef.current);
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

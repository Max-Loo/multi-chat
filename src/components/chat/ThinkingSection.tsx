import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { generateCleanHtml } from "@/utils/markdown";

/**
 * 推理内容折叠组件的属性接口
 */
interface ThinkingSectionProps {
  /** 区域标题 */
  title: string;
  /** 推理内容（Markdown 格式） */
  content: string;
  /** 是否处于加载状态 */
  loading?: boolean;
  /** 初始展开状态（默认折叠） */
  initiallyExpanded?: boolean;
}

/**
 * 推理内容折叠组件
 * @description 显示 AI 的推理内容，支持折叠/展开交互
 */
export const ThinkingSection: React.FC<ThinkingSectionProps> = ({
  title,
  content,
  loading = false,
  initiallyExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  // 缓存推理内容的 HTML（避免重复生成导致重新渲染）
  const contentHtml = useMemo(() => {
    return generateCleanHtml(content);
  }, [content]);

  return (
    <Card className="mb-2 bg-transparent border-none shadow-none">
      {/* 折叠按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full font-normal hover:bg-muted/50"
      >
        <div className="flex items-center w-full">
          {/* 标题 */}
          <span
            className={`text-sm text-left mr-2 ${loading && "animate-pulse-fade"}`}
          >
            {title}
          </span>

          {/* 右侧：折叠/展开图标 */}
          {expanded ? <ChevronDown size={4} /> : <ChevronRight size={4} />}
        </div>
      </Button>

      {/* 推理内容 */}
      {expanded && (
        <div className="pl-4 pb-4 mt-2 border-l-2 border-gray-300">
          <div
            className="text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: contentHtml,
            }}
          />
        </div>
      )}
    </Card>
  );
};

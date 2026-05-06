import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { StreamingContent } from "./StreamingContent";

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

  return (
    <div className="mb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full font-normal hover:bg-muted/50"
      >
        <div className="flex items-center w-full">
          <span
            className={`text-sm text-left mr-2 ${loading && "animate-pulse-fade"}`}
          >
            {title}
          </span>

          {expanded ? <ChevronDown size={4} /> : <ChevronRight size={4} />}
        </div>
      </Button>

      {expanded && (
        <div className="pl-4 pb-4 mt-2 border-l-2 border-gray-300">
          <StreamingContent
            className="text-sm text-muted-foreground"
            content={content}
            isRunning={loading}
          />
        </div>
      )}
    </div>
  );
};

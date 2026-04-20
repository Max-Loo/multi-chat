import { Card } from "@/components/ui/card";
import { ChatRoleEnum } from "@/types/chat";
import { memo, useMemo } from "react";
import { ThinkingSection } from "./ThinkingSection";
import { generateCleanHtml } from "@/utils/markdown";
import { useTranslation } from "react-i18next"

/**
 * 聊天气泡组件的属性接口
 */
interface ChatBubbleProps {
  /** 消息角色 */
  role: ChatRoleEnum;
  /** 消息内容 */
  content: string;
  /** 推理内容（可选） */
  reasoningContent?: string;
  /** 是否正在生成中 */
  isRunning?: boolean;
}

/**
 * 聊天气泡组件
 * @description 显示用户和 AI 助手的聊天气泡，支持 Markdown 渲染和代码高亮
 */
const ChatBubbleInner: React.FC<ChatBubbleProps> = ({
  role,
  content,
  reasoningContent,
  isRunning = false,
}) => {
  const { t } = useTranslation()
  // 推理内容的加载状态
  const thinkingLoading = useMemo(() => {
    return isRunning && !content;
  }, [isRunning, content]);

  // 缓存消息内容的 HTML（避免重复生成导致重新渲染）
  const contentHtml = useMemo(() => {
    return generateCleanHtml(content);
  }, [content]);

  // 根据角色决定气泡样式和对齐方式
  switch (role) {
    // 用户对话气泡
    case ChatRoleEnum.USER: {
      return (
        <div className="flex justify-end w-full mt-3 mr-2" data-testid="chat-bubble">
          <Card className="bg-gray-100 text-gray-800 max-w-[80%] border-none shadow-none">
            <div
              className="p-4"
              dangerouslySetInnerHTML={{
                __html: contentHtml,
              }}
            />
          </Card>
        </div>
      );
    }
    // AI 助手对话气泡
    case ChatRoleEnum.ASSISTANT: {
      return (
        <div className="flex justify-start w-full mt-3 ml-2" data-testid="chat-bubble">
          <Card className="border-none shadow-none max-w-[80%]">
            <div className="w-full">
              {/* 推理内容区域 */}
              {reasoningContent && (
                <ThinkingSection
                  title={thinkingLoading ? t(($) => $.chat.thinking) : t(($) => $.chat.thinkingComplete)}
                  content={reasoningContent}
                  loading={thinkingLoading}
                />
              )}
              {/* 正式回复内容 */}
              {content && (
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml,
                  }}
                />
              )}
            </div>
          </Card>
        </div>
      );
    }
    // 暂时忽略其他类型的气泡
    default: {
      return null;
    }
  }
};

/**
 * 自定义比较函数，只比较关键 props 避免不必要的重渲染
 */
const arePropsEqual = (
  prevProps: ChatBubbleProps,
  nextProps: ChatBubbleProps,
) => {
  return (
    prevProps.role === nextProps.role &&
    prevProps.content === nextProps.content &&
    prevProps.reasoningContent === nextProps.reasoningContent &&
    prevProps.isRunning === nextProps.isRunning
  );
};

export const ChatBubble = memo(ChatBubbleInner, arePropsEqual);

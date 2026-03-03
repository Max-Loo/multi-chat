import { Card } from "@/components/ui/card";
import { ChatRoleEnum } from "@/types/chat";
import { useMemo } from "react";
import { ThinkingSection } from "./ThinkingSection";
import { generateCleanHtml } from "@/utils/markdown";

/**
 * 模型供应商信息接口
 */
interface ModelProvider {
  /** 供应商唯一标识 */
  providerKey: string;
}

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
  /** 模型供应商信息（用于显示 logo） */
  provider?: ModelProvider;
}

/**
 * 聊天气泡组件
 * @description 显示用户和 AI 助手的聊天气泡，支持 Markdown 渲染和代码高亮
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  reasoningContent,
  isRunning = false,
  provider,
}) => {
  // 推理内容的加载状态
  const thinkingLoading = useMemo(() => {
    return isRunning && !content;
  }, [isRunning, content]);

  // 根据角色决定气泡样式和对齐方式
  switch (role) {
    // 用户对话气泡
    case ChatRoleEnum.USER: {
      return (
        <div className="flex justify-end w-full mt-3 mr-2" data-testid="chat-bubble">
          <Card className="bg-primary text-primary-foreground max-w-[80%] border-none shadow-none">
            <div
              className="p-4"
              dangerouslySetInnerHTML={{
                __html: generateCleanHtml(content),
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
                  title={thinkingLoading ? "思考中" : "思考完成"}
                  content={reasoningContent}
                  loading={thinkingLoading}
                  provider={provider}
                />
              )}
              {/* 正式回复内容 */}
              {content && (
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{
                    __html: generateCleanHtml(content),
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

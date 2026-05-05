import { Card } from "@/components/ui/card";
import { ChatRoleEnum } from "@/types/chat";
import { memo, useMemo, useState, useRef, useCallback, useEffect } from "react";
import { ThinkingSection } from "./ThinkingSection";
import { generateCleanHtml } from "@/utils/markdown";
import { useTranslation } from "react-i18next";
import { getCurrentContent } from "@/services/chat/chatHistoryHelper";
import {
  Copy,
  Pencil,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * 聊天气泡组件的属性接口
 */
interface ChatBubbleProps {
  /** 消息角色 */
  role: ChatRoleEnum;
  /** 消息内容（string = 无编辑历史，string[] = 有编辑历史） */
  content: string | string[];
  /** 推理内容（可选，同 content 支持编辑历史） */
  reasoningContent?: string | string[];
  /** 是否正在生成中 */
  isRunning?: boolean;
  /** 消息唯一标识 */
  messageId?: string;
  /** 是否为最新用户消息（控制编辑按钮） */
  isLatestUserMessage?: boolean;
  /** 是否为最后一条 AI 回复（控制重新生成按钮） */
  isLastAssistant?: boolean;
  /** 复制回调 */
  onCopy?: (messageId: string) => void;
  /** 编辑回调 */
  onEdit?: (messageId: string, newContent: string) => void;
  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void;
  /** 聊天是否正在发送中（禁用编辑/重新生成按钮） */
  isChatSending?: boolean;
  /** 外部历史索引（成对展示时由父组件控制） */
  historyIndexOverride?: number;
  /** 历史索引变更回调（用于成对同步） */
  onHistoryIndexChange?: (index: number) => void;
}

/**
 * 操作工具栏组件
 */
const ActionToolbar: React.FC<{
  role: ChatRoleEnum;
  messageId?: string;
  isLatestUserMessage?: boolean;
  isLastAssistant?: boolean;
  disabled?: boolean;
  onCopy?: (messageId: string) => void;
  onEdit?: () => void;
  onRegenerate?: (messageId: string) => void;
}> = ({
  role,
  messageId,
  isLatestUserMessage,
  isLastAssistant,
  disabled,
  onCopy,
  onEdit,
  onRegenerate,
}) => {
  const { t } = useTranslation();

  if (!messageId) return null;

  const handleCopy = () => {
    if (messageId && onCopy) onCopy(messageId);
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      {/* 复制按钮 — 所有消息都有 */}
      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        title={t(($) => $.chat.copyMessage)}
      >
        <Copy className="size-3.5" />
      </button>

      {/* 编辑按钮 — 仅最新用户消息 */}
      {role === ChatRoleEnum.USER && isLatestUserMessage && onEdit && (
        <button
          onClick={onEdit}
          disabled={disabled}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t(($) => $.chat.editMessage)}
        >
          <Pencil className="size-3.5" />
        </button>
      )}

      {/* 重新生成按钮 — 仅最后一条 AI 回复 */}
      {role === ChatRoleEnum.ASSISTANT && isLastAssistant && onRegenerate && (
        <button
          onClick={() => onRegenerate(messageId)}
          disabled={disabled}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={t(($) => $.chat.regenerateMessage)}
        >
          <RefreshCw className="size-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * 编辑历史翻页控件
 */
const HistoryPager: React.FC<{
  content: string | string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}> = ({ content, currentIndex, onIndexChange }) => {
  const total = Array.isArray(content) ? content.length : 1;

  if (total <= 1) return null;

  return (
    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
      <button
        onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
        disabled={currentIndex === 0}
        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-3.5" />
      </button>
      <span className="min-w-8 text-center">
        {currentIndex + 1}/{total}
      </span>
      <button
        onClick={() => onIndexChange(Math.min(total - 1, currentIndex + 1))}
        disabled={currentIndex === total - 1}
        className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
};

/**
 * 聊天气泡组件
 * @description 显示用户和 AI 助手的聊天气泡，支持 Markdown 渲染、代码高亮、操作工具栏、行内编辑和历史翻页
 */
const ChatBubbleInner: React.FC<ChatBubbleProps> = ({
  role,
  content,
  reasoningContent,
  isRunning = false,
  messageId,
  isLatestUserMessage,
  isLastAssistant,
  onCopy,
  onEdit,
  onRegenerate,
  isChatSending,
  historyIndexOverride,
  onHistoryIndexChange,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [internalHistoryIndex, setInternalHistoryIndex] = useState(() =>
    Array.isArray(content) ? content.length - 1 : 0,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 使用外部索引（成对同步）或内部索引
  const historyIndex =
    historyIndexOverride !== undefined
      ? historyIndexOverride
      : internalHistoryIndex;

  // 当前版本的内容
  const currentContent = useMemo(() => {
    if (Array.isArray(content)) {
      return content[historyIndex] ?? content[content.length - 1];
    }
    return content;
  }, [content, historyIndex]);

  const currentReasoning = useMemo(() => {
    if (!reasoningContent) return undefined;
    if (Array.isArray(reasoningContent)) {
      const idx = Math.min(historyIndex, reasoningContent.length - 1);
      return reasoningContent[idx];
    }
    return reasoningContent;
  }, [reasoningContent, historyIndex]);

  // 当 content 外部更新时（如编辑确认后），重置内部 historyIndex 到最新
  useEffect(() => {
    if (Array.isArray(content)) {
      setInternalHistoryIndex(content.length - 1);
      onHistoryIndexChange?.(content.length - 1);
    }
  }, [content, onHistoryIndexChange]);

  // 推理内容的加载状态
  const thinkingLoading = useMemo(() => {
    return isRunning && !currentContent;
  }, [isRunning, currentContent]);

  // 缓存消息内容的 HTML（避免重复生成导致重新渲染）
  const contentHtml = useMemo(() => {
    return generateCleanHtml(currentContent);
  }, [currentContent]);

  // 进入编辑模式
  const handleStartEdit = useCallback(() => {
    setEditText(getCurrentContent(content));
    setIsEditing(true);
    // 延迟聚焦以确保 DOM 已更新
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }, 0);
  }, [content]);

  // 确认编辑
  const handleConfirmEdit = useCallback(() => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    if (messageId && onEdit) {
      onEdit(messageId, trimmed);
    }
    setIsEditing(false);
  }, [editText, messageId, onEdit]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditText("");
  }, []);

  // 编辑模式的键盘事件
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleConfirmEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleConfirmEdit, handleCancelEdit],
  );

  // 翻页回调：同步更新内部状态并通知父组件
  const handleHistoryIndexChange = useCallback(
    (index: number) => {
      setInternalHistoryIndex(index);
      onHistoryIndexChange?.(index);
    },
    [onHistoryIndexChange],
  );

  // 是否显示操作栏（始终显示，发送期间通过 disabled 禁用按钮）
  const showActions = !!messageId;

  // 根据角色决定气泡样式和对齐方式
  switch (role) {
    // 用户对话气泡
    case ChatRoleEnum.USER: {
      return (
        <div
          className="flex justify-end w-full mt-3 mr-2"
          data-testid="chat-bubble"
        >
          <Card className="bg-gray-100 text-gray-800 max-w-[80%] border-none shadow-none">
            {isEditing ? (
              // 编辑模式
              <div className="p-3">
                <textarea
                  ref={textareaRef}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="w-full min-h-15 resize-none bg-white border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <div className="flex items-center gap-1 mt-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                    title={t(($) => $.chat.editCancel)}
                  >
                    <X className="size-4" />
                  </button>
                  <button
                    onClick={handleConfirmEdit}
                    disabled={!editText.trim()}
                    className="p-1.5 rounded hover:bg-blue-100 text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={t(($) => $.chat.editConfirm)}
                  >
                    <Check className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              // 展示模式
              <>
                <div
                  className="p-4"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml,
                  }}
                />
                {/* 编辑历史翻页 */}
                <div className="px-4 pb-1">
                  <HistoryPager
                    content={content}
                    currentIndex={historyIndex}
                    onIndexChange={handleHistoryIndexChange}
                  />
                </div>
                {/* 操作工具栏 */}
                {showActions && (
                  <div className="px-4 pb-2">
                    <ActionToolbar
                      role={role}
                      messageId={messageId}
                      isLatestUserMessage={isLatestUserMessage}
                      disabled={isChatSending}
                      onEdit={handleStartEdit}
                      onCopy={onCopy}
                    />
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      );
    }
    // AI 助手对话气泡
    case ChatRoleEnum.ASSISTANT: {
      return (
        <div
          className="flex justify-start w-full mt-3 ml-2"
          data-testid="chat-bubble"
        >
          <Card className="border-none shadow-none max-w-[80%]">
            <div className="w-full">
              {/* 推理内容区域 */}
              {currentReasoning && (
                <ThinkingSection
                  title={
                    thinkingLoading
                      ? t(($) => $.chat.thinking)
                      : t(($) => $.chat.thinkingComplete)
                  }
                  content={currentReasoning}
                  loading={thinkingLoading}
                />
              )}
              {/* 正式回复内容 */}
              {currentContent && (
                <div
                  className="mt-2"
                  dangerouslySetInnerHTML={{
                    __html: contentHtml,
                  }}
                />
              )}
              {/* 编辑历史翻页 */}
              <div className="mt-1">
                <HistoryPager
                  content={content}
                  currentIndex={historyIndex}
                  onIndexChange={handleHistoryIndexChange}
                />
              </div>
              {/* 操作工具栏 */}
              {showActions && (
                <div className="mt-1">
                  <ActionToolbar
                    role={role}
                    messageId={messageId}
                    isLastAssistant={isLastAssistant}
                    disabled={isChatSending}
                    onCopy={onCopy}
                    onRegenerate={onRegenerate}
                  />
                </div>
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
 * 比较内容是否相等（支持 string | string[] 类型）
 */
const isContentEqual = (
  a: string | string[] | undefined,
  b: string | string[] | undefined,
): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a[a.length - 1] === b[b.length - 1];
  }
  return false;
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
    isContentEqual(prevProps.content, nextProps.content) &&
    isContentEqual(prevProps.reasoningContent, nextProps.reasoningContent) &&
    prevProps.isRunning === nextProps.isRunning &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.isLatestUserMessage === nextProps.isLatestUserMessage &&
    prevProps.isLastAssistant === nextProps.isLastAssistant &&
    prevProps.onCopy === nextProps.onCopy &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.isChatSending === nextProps.isChatSending &&
    prevProps.historyIndexOverride === nextProps.historyIndexOverride &&
    prevProps.onHistoryIndexChange === nextProps.onHistoryIndexChange
  );
};

export const ChatBubble = memo(ChatBubbleInner, arePropsEqual);

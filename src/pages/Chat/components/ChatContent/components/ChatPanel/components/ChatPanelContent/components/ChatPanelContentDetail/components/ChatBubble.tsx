import { ChatRoleEnum, StandardMessage } from "@/types/chat";
import { Bubble, Think } from '@ant-design/x';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import markdownit from 'markdown-it'
import { useEffect, useMemo, useState } from "react";

interface ChatBubbleProps {
  // 是否为正在生成中的气泡，设置为 true 才会有加载动画
  isRunningBubble?: boolean;
  // 消息体
  historyRecord: StandardMessage
}


// 将 markdown 字符串转换成安全的 html 字符串
const generateCleanHtml = (dirtyMarkdown: string) => {

  const marked = markdownit({
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return `<pre><code class="hljs rounded-xl mt-2 mb-2 scrollbar-none overflow-x-auto language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
      }
      // 未识别语言也做默认高亮
      return `<pre><code class="hljs scrollbar-none overflow-x-auto rounded-xl mt-2 mb-2">${hljs.highlightAuto(str).value}</code></pre>`;
    },
  });

  return DOMPurify.sanitize(marked.render(dirtyMarkdown))
}

/**
 * @description 聊天气泡
 */
const ChatBubble: React.FC<ChatBubbleProps> = ({
  historyRecord,
  isRunningBubble = false,
}) => {

  const {
    role,
    content,
    reasoningContent,
  } = historyRecord


  const [thinkingExpanded, setThinkingExpanded] = useState(isRunningBubble && true)

  useEffect(() => {
    // 思考完毕以后，折叠思考内容
    if (content) {
      setThinkingExpanded(false)
    }
  }, [content])

  // 是否处于 thinking 状态
  const thinkingLoading = useMemo(() => {
    return isRunningBubble && !content
  }, [isRunningBubble, content])

  // think 组件的 title
  const thinkingTitle = useMemo(() => {
    return thinkingLoading ? '思考中...' : '思考完毕'
  }, [thinkingLoading])

  switch (role) {
    // 用户对话气泡
    case ChatRoleEnum.USER: {
      return <Bubble
        className="w-full mt-3"
        content={content}
        placement="end"
      />
    }
    // AI 助手对话气泡
    case ChatRoleEnum.ASSISTANT: {
      return <Bubble
        className="w-full mt-3"
        classNames={{
          body: 'w-full',
        }}
        content={content}
        variant="borderless"
        placement="start"
        contentRender={(content) => {
          return <>
            {reasoningContent && <Think
              title={thinkingTitle}
              expanded={thinkingExpanded}
              onExpand={setThinkingExpanded}
              // 还没有生成正式内容的时候
              loading={thinkingLoading}
            >
              <div dangerouslySetInnerHTML={{
                __html: generateCleanHtml(reasoningContent),
              }} />
            </Think>}
            {content && <div
              className="mt-2"
              dangerouslySetInnerHTML={{
                __html: generateCleanHtml(content),
              }}
            />}
          </>
        }}
      />
    }
    // 暂时忽略其他类型的气泡
    default: {
      return null
    }
  }
}

export default ChatBubble
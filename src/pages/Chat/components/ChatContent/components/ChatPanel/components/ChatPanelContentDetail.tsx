import { useAppSelector } from "@/hooks/redux"
import { ChatModel, ChatRoleEnum, StandardMessage } from "@/types/chat"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat"
import { JSX, useCallback, useMemo } from "react"
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { isNil, isNotNil } from "es-toolkit"
import markdownit from 'markdown-it'
import { Alert, Spin, Tag } from "antd";

interface ChatPanelContentDetailProps {
  chatModel: ChatModel
}

/**
 * @description 具体渲染聊天内容的组件
 */
const ChatPanelContentDetail: React.FC<ChatPanelContentDetailProps> = ({
  chatModel,
}) => {
  // 模型列表
  const models = useAppSelector(state => state.models.models)
  // 当前展示的模型在模型列表里面的完整版
  const currentModel = useMemo(() => {
    return models.find(model => model.id === chatModel.modelId)
  }, [chatModel, models])

  const {
    selectedChat,
  } = useTypedSelectedChat()

  // 当前在运行的聊天
  const runningChat = useAppSelector(state => state.chat.runningChat)

  // 将 markdown 字符串转换成安全的 html 字符串
  const getCleanHtml = useCallback((dirtyMarkdown: string) => {

    const marked = markdownit({
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          return `<pre><code class="hljs rounded-xl mt-2 mb-2 language-${lang}">${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        }
        // 未识别语言也做默认高亮
        return `<pre><code class="hljs rounded-xl mt-2 mb-2">${hljs.highlightAuto(str).value}</code></pre>`;
      },
    });

    return DOMPurify.sanitize(marked.render(dirtyMarkdown))
  }, [])

  // 组合起来的，进行循环渲染的列表
  const actualHistoryRecordList = useMemo<StandardMessage[]>(() => {
    const list: StandardMessage[] = Array.isArray(chatModel.chatHistoryList) ? [...chatModel.chatHistoryList] : []

    const currentRunningChat = runningChat[selectedChat.id]?.[chatModel.modelId]


    if (isNotNil(currentRunningChat) && isNotNil(currentRunningChat.history) && currentRunningChat.isSending) {
      list.push(currentRunningChat.history)
    }

    return list
  }, [
    runningChat,
    chatModel.chatHistoryList,
    chatModel.modelId,
    selectedChat.id,
  ])

  const getTitle = useCallback(() => {

    if (isNil(currentModel)) {
      return <Tag color="red">模型已删除</Tag>
    }

    let statusTag: JSX.Element | null = null

    if (currentModel.isDeleted) {
      statusTag = <Tag color="red">已删除</Tag>
    }

    if (!currentModel.isEnable) {
      statusTag = <Tag color="orange">被禁用</Tag>
    }

    return <div className="flex items-center">
      {`${currentModel.providerName} | ${currentModel.modelName} | ${currentModel.nickname}`}
      <div className="ml-2">{statusTag}</div>
    </div>


  }, [currentModel])


  return <div className="flex flex-col items-center text-base">
    {getTitle()}
    {actualHistoryRecordList.map(historyRecord => {
      const {
        id,
        role,
        content,
        // reasoningContent,
      } = historyRecord

      switch (role) {
        // 用户对话气泡
        case ChatRoleEnum.USER: {
          return <div
            key={id}
            className={`self-end bg-gray-200 rounded-full
             pt-2 pb-2 pl-4 pr-4 mt-4 mb-4 ml-16
            `}
            dangerouslySetInnerHTML={{
              __html: getCleanHtml(content),
            }}
          ></div>
        }
        // AI 助手对话气泡
        case ChatRoleEnum.ASSISTANT: {
          return <div
            key={id}
            className={`
              self-start
              mt-4 mb-4
            `}
            dangerouslySetInnerHTML={{
              __html: getCleanHtml(content),
            }}
          />
        }
        default: {
          return <div key={id}>{ content }</div>
        }
      }
    })}
    {/* 展示可能的错误信息 */}
    {
      runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage
      && <Alert
        title={runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage}
        type="error"
        className="self-start"
      />
    }
  </div>
}


export default ChatPanelContentDetail
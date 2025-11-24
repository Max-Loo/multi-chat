import { useAppSelector } from "@/hooks/redux"
import { ChatModel, ChatRoleEnum, StandardMessage } from "@/types/chat"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat"
import { useCallback, useMemo } from "react"
import { Marked } from 'marked'
import DOMPurify from 'dompurify';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { isNotNil } from "es-toolkit"

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
    const marked = new Marked({
      breaks: true,
    }, markedHighlight({
      async: false,
      emptyLangClass: 'hljs rounded-md',
      langPrefix: 'hljs rounded-xl language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }))

    // 自定义复制按钮
    // const renderer = new marked.Renderer();

    // // renderer.code = ({ text, lang }) => {
    // //   const langClass = lang ? `language-${lang}` : '';
    // //   return <pre><code className="hljs ${langClass}">${text}</code></pre>
    // // };

    // // // 使用自定义 renderer
    // // marked.setOptions({ renderer });

    return DOMPurify.sanitize(marked.parse(dirtyMarkdown) as string)
  }, [])

  // 组合起来的，进行循环渲染的列表
  const actualHistoryRecordList = useMemo<StandardMessage[]>(() => {
    const list: StandardMessage[] = Array.isArray(chatModel.chatHistoryList) ? [...chatModel.chatHistoryList] : []

    const runningHistory = runningChat[selectedChat.id]?.[chatModel.modelId]?.history

    if (isNotNil(runningHistory)) {
      list.push(runningHistory)
    }

    return list
  }, [
    runningChat,
    chatModel.chatHistoryList,
    chatModel.modelId,
    selectedChat.id,
  ])


  return <div className="flex flex-col items-center text-base">
    {currentModel ? `${currentModel.providerName} | ${currentModel.modelName} | ${currentModel.nickname}` : '该模型已经被删除'}
    {actualHistoryRecordList.map(historyRecord => {
      const {
        id,
        role,
        content,
        raw,
      } = historyRecord
      if (raw) {

        console.log('raw', JSON.parse(raw));
      }


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
          ></div>
        }
        default: {
          return <div key={id}>{ content }</div>
        }
      }
    })}
  </div>
}


export default ChatPanelContentDetail
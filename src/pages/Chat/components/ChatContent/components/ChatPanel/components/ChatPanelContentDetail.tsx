import { useAppSelector } from "@/hooks/redux"
import { ChatModel, ChatRoleEnum, StandardizedHistoryRecord } from "@/types/chat"
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat"
import { useCallback, useMemo } from "react"
import { Marked } from 'marked'
import DOMPurify from 'dompurify';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { isNil, isString } from "es-toolkit"
import { ModelProviderFactoryCreator } from "@/lib/factory/modelProviderFactory"
import { v4 as uuidV4 } from 'uuid'

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
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }))

    return DOMPurify.sanitize(marked.parse(dirtyMarkdown) as string)
  }, [])

  // 获取历史聊天记录中，具体聊天内容的部分
  const getHistoryRecord = useCallback((history: string): StandardizedHistoryRecord => {
    /**
     * 如果对应的 model 已经被删除（理论上只是假删除），将无法获取到具体对应的模型服务商
     * 即因为不知道具体的类型而无法准确获取到具体聊天内容
     */
    if (isNil(currentModel)) {
      return {
        id: ChatRoleEnum.UNKNOWN + uuidV4(),
        role: ChatRoleEnum.UNKNOWN,
        content: history,
      }
    }

    const renderHistory = ModelProviderFactoryCreator.getFactory(currentModel.providerKey).getRenderHtml()

    return renderHistory.getHistoryRecord(history)
  }, [currentModel])

  // 组合起来的，进行循环渲染的列表
  const actualHistoryRecordList = useMemo<StandardizedHistoryRecord[]>(() => {
    const list = Array.isArray(chatModel.chatHistoryList) ? chatModel.chatHistoryList.map(history => {
      return getHistoryRecord(history)
    }) : []

    const runningHistoryStr = runningChat[selectedChat.id]?.[chatModel.modelId]?.history
    // 将正在运行的对话放到最后面
    if (isString(runningHistoryStr)) {
      list.push(getHistoryRecord(runningHistoryStr))
    }

    return list
  }, [
    chatModel.chatHistoryList,
    chatModel.modelId,
    getHistoryRecord,
    runningChat,
    selectedChat.id,
  ])

  return <div className="flex flex-col items-center text-base">
    {currentModel ? `${currentModel.modelName} | ${currentModel.nickname}` : '该模型已经被删除'}
    {actualHistoryRecordList.map(historyRecord => {
      const {
        id,
        role,
        content,
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
              __html: getCleanHtml(content.repeat(15)),
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
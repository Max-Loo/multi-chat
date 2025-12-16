import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useNavigateToChat } from "@/hooks/useNavigateToPage"
import { deleteChat, editChatName } from "@/store/slices/chatSlices"
import { Chat } from "@/types/chat"
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, EllipsisOutlined } from "@ant-design/icons"
import type { MenuProps } from 'antd'
import { App, Button, Dropdown, Input } from "antd"
import { memo, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

interface ChatButtonProps {
  // 当前选中要进行操作的聊天
  chat: Chat
}

/**
 * @description 聊天列表中的单个聊天按钮
 */
const ChatButton = memo<ChatButtonProps>(({
  chat,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const selectedChatId = useAppSelector((state) => state.chat.selectedChatId)

  const {
    navigateToChat,
  } = useNavigateToChat()

  const {
    modal,
    message,
  } = App.useApp()

  // 点击聊天列表按钮
  const onClickChat = (chat: Chat) => {
    // 跳转到对应的聊天详情
    navigateToChat({
      chatId: chat.id,
    })
  }

  // 是否打开重命名的输入框
  const [isRenaming, setIsRenaming] = useState(false)

  const menuProps: MenuProps['items'] = useMemo(() => {
    return [
      {
        label: t($ => $.chat.rename),
        key: 'rename',
        icon: <EditOutlined />,
        onClick: (menuInfo) => {
          // 避免选中该聊天
          menuInfo.domEvent.stopPropagation()

          setIsRenaming(true)
          // 填充原本的命名
          setNewName(chat.name || '')
        },
      },
      {
        type: 'divider',
      },
      {
        label: t($ => $.chat.delete),
        key: 'delete',
        icon: <DeleteOutlined/>,
        className: 'text-red-500!',
        onClick: (menuInfo) => {
          // 避免选中该聊天
          menuInfo.domEvent.stopPropagation()

          const onOk = () => {
            try {
              dispatch(deleteChat({
                chat,
              }))
              message.success(t($ => $.chat.deleteChatSuccess))
            } catch {
              message.error(t($ => $.chat.deleteChatFailed))
            }
          }

          modal.warning({
            maskClosable: true,
            closable: true,
            title: `${t($ => $.chat.confirmDelete)}「${chat.name}」`,
            content: t($ => $.chat.deleteChatConfirm),
            onOk,
          })
        },
      },
    ]
  }, [chat, dispatch, modal, message, t])


  // 临时的重命名
  const [newName, setNewName] = useState('')

  // 取消重命名
  const onCancelRename = () => {
    setIsRenaming(false)
  }

  // 确认重命名
  const onConfirmRename = () => {
    // 避免没有意义的编辑
    if (newName === chat.name) {
      onCancelRename()
      return
    }

    try {
      // 因为当前组件被 memo，并不一定能获取到最新的 chat，故使用 editChatName 而不是 editChat
      dispatch(editChatName({
        id: chat.id,
        name: newName,
      }))

      message.success(t($ => $.chat.editChatSuccess))
      onCancelRename()
    } catch {
      message.error(t($ => $.chat.editChatFailed))
    }
  }


  // 打开编辑状态
  if (isRenaming) {
    return (
      <div
        className={`flex items-center justify-center w-full h-11
        ${chat.id === selectedChatId && 'bg-gray-200!'} 
        `}
      >
        <Input
          className="w-38.5! h-8.5"
          value={newName}
          autoFocus
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button
          color="green"
          variant="filled"
          icon={<CheckOutlined />}
          onClick={onConfirmRename}
          className="ml-1 mr-0.5"
        />
        <Button
          color="danger"
          variant="filled"
          icon={<CloseOutlined />}
          onClick={onCancelRename}
          className="ml-0.5"
        />
      </div>
    )
  }


  return (
    <Button
      type="text"
      className={`w-full py-5! flex justify-between! rounded-none! 
        ${chat.id === selectedChatId && 'bg-gray-200!'} 
        ${isRenaming && 'pl-1! pr-1!'}
      `}
      onClick={() => onClickChat(chat)}
    >
      <span className="pl-2 text-sm">{chat.name || t($ => $.chat.unnamed)}</span>
      <Dropdown menu={{ items: menuProps }} trigger={['click']} arrow>
        <EllipsisOutlined
          name="More options"
          className="text-xl!"
          onClick={(e) => {
          // 防止点击更多，导致选中这个聊天
            e.stopPropagation()
          }}
        />
      </Dropdown>
    </Button>
  )
}, (prevProps, nextProps) => {
  // 因为按钮只展示模型的昵称，所以当其没有发生变化的时候，就不需要重新渲染
  const {
    id,
    name,
  } = prevProps.chat
  const {
    id: nextId,
    name: nextName,
  } = nextProps.chat

  return id === nextId && name === nextName
})


export default ChatButton
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useNavigateToChat } from "@/hooks/useNavigateToPage"
import { deleteChat, editChatName } from "@/store/slices/chatSlices"
import { Chat } from "@/types/chat"
import { Check, X, Trash2, Edit, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { memo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from 'sonner'
import { useConfirm } from "@/hooks/useConfirm"

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
    navigateToChatWithoutParams,
  } = useNavigateToChat()

  // 使用自定义 hooks 替代 antd 的 App.useApp()
  const { modal } = useConfirm()

  // 点击聊天列表按钮
  const onClickChat = (chat: Chat) => {
    // 跳转到对应的聊天详情
    navigateToChat({
      chatId: chat.id,
    })
  }

  // 是否打开重命名的输入框
  const [isRenaming, setIsRenaming] = useState(false)

  // 临时的重命名
  const [newName, setNewName] = useState('')

  // 处理重命名操作
  const handleRename = () => {
    setIsRenaming(true)
    setNewName(chat.name || '')
  }

  // 处理删除操作
  const handleDelete = () => {
    const onOk = () => {
      try {
        dispatch(deleteChat({
          chat,
        }))
        toast.success(t($ => $.chat.deleteChatSuccess))

        // 如果删除的是当前选中的聊天，清除 URL 查询参数
        if (chat.id === selectedChatId) {
          navigateToChatWithoutParams()
        }
      } catch {
        toast.error(t($ => $.chat.deleteChatFailed))
      }
    }

    modal.warning({
      title: `${t($ => $.chat.confirmDelete)}「${chat.name || t($ => $.chat.unnamed)}」`,
      description: t($ => $.chat.deleteChatConfirm),
      onOk,
    })
  }

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

      toast.success(t($ => $.chat.editChatSuccess))
      onCancelRename()
    } catch {
      toast.error(t($ => $.chat.editChatFailed))
    }
  }


  // 打开编辑状态
  if (isRenaming) {
    return (
      <div
        className={`flex items-center gap-2 w-full px-2 py-2
        ${chat.id === selectedChatId && 'bg-primary/20'}
        `}
      >
        <Input
          className="flex-1 h-8.5 text-sm"
          value={newName}
          autoFocus
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button
          variant="default"
          size="sm"
          onClick={onConfirmRename}
          className="h-8 w-8 p-0 shrink-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancelRename}
          className="h-8 w-8 p-0 shrink-0 text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }


  return (
    <div
      className={`w-full py-2 px-1 flex justify-between rounded-none cursor-pointer
        ${chat.id === selectedChatId ? 'bg-primary/20' : 'hover:bg-accent'}
        ${isRenaming && 'pl-1 pr-1'}
      `}
      onClick={() => onClickChat(chat)}
    >
      <span className="pl-2 text-sm flex items-center">{chat.name || t($ => $.chat.unnamed)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation()
            handleRename()
          }}>
            <Edit className="mr-2 h-4 w-4" />
            {t($ => $.chat.rename)}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t($ => $.chat.delete)}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
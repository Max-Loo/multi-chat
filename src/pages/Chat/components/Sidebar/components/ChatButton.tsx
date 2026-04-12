import { useAppDispatch } from "@/hooks/redux"
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
import { toastQueue } from '@/services/toast'
import { useConfirm } from "@/hooks/useConfirm"
import { useResponsive } from "@/hooks/useResponsive"

export interface ChatButtonProps {
  chat: Chat
  isSelected: boolean
}

/**
 * @description 聊天列表中的单个聊天按钮
 */
const ChatButton = memo<ChatButtonProps>(({
  chat,
  isSelected,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const { layoutMode } = useResponsive()
  // Desktop 和 Mobile 模式使用正常尺寸
  const isNormalSize = layoutMode === 'desktop' || layoutMode === 'mobile'

  const {
    navigateToChat,
    clearChatIdParam,
  } = useNavigateToChat()

  // 使用自定义 hooks 替代 antd 的 App.useApp()
  const { modal } = useConfirm()

  // 点击聊天列表按钮
  const onClickChat = (clickedChat: Chat) => {
    // 跳转到对应的聊天详情
    navigateToChat({
      chatId: clickedChat.id,
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
    const onOk = async () => {
      try {
        await dispatch(deleteChat({
          chat,
        }))
        toastQueue.success(t($ => $.chat.deleteChatSuccess))

        // 如果删除的是当前选中的聊天，清除 URL 中的 chatId 参数
        if (isSelected) {
          clearChatIdParam()
        }
      } catch {
        toastQueue.error(t($ => $.chat.deleteChatFailed))
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

      toastQueue.success(t($ => $.chat.editChatSuccess))
      onCancelRename()
    } catch {
      toastQueue.error(t($ => $.chat.editChatFailed))
    }
  }


  // 打开编辑状态
  if (isRenaming) {
    return (
      <div
        className={`flex items-center gap-2 w-full px-2 py-2
        ${isSelected && 'bg-primary/20'}
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
          disabled={!newName.trim()}
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
      data-testid={`chat-button-${chat.id}`}
      className={`w-full flex justify-between rounded-none cursor-pointer
        ${
          isNormalSize
            ? 'py-2 px-1'
            : 'py-1.5 px-1'
        }
        ${isSelected ? 'bg-primary/20' : 'hover:bg-accent'}
        ${isRenaming && 'pl-1 pr-1'}
      `}
      onClick={() => onClickChat(chat)}
    >
      <span
        data-testid="chat-name"
        className={`pl-2 flex items-center ${
          isNormalSize
            ? 'text-sm'
            : 'text-xs'
        }`}
      >
        {chat.name || t($ => $.chat.unnamed)}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`p-0 ${
              isNormalSize
                ? 'h-8 w-8'
                : 'h-7 w-7'
            }`}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreHorizontal className={`${
              isNormalSize
                ? 'h-4 w-4'
                : 'h-3.5 w-3.5'
            }`} />
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
  const {
    id,
    name,
  } = prevProps.chat
  const {
    id: nextId,
    name: nextName,
  } = nextProps.chat

  return (
    id === nextId &&
    name === nextName &&
    prevProps.isSelected === nextProps.isSelected
  )
})


export default ChatButton
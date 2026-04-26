import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useNavigateToChat } from "@/hooks/useNavigateToPage"
import { deleteChat, editChatName } from "@/store/slices/chatSlices"
import { ChatMeta } from "@/types/chat"
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
import { memo, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toastQueue } from '@/services/toast'
import { useConfirm } from "@/hooks/useConfirm"
import { useResponsive } from "@/hooks/useResponsive"

export interface ChatButtonProps {
  chatMeta: ChatMeta
  isSelected: boolean
}

/**
 * @description 聊天列表中的单个聊天按钮
 */
const ChatButton = memo<ChatButtonProps>(({
  chatMeta,
  isSelected,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const sendingChatIds = useAppSelector(state => state.chat.sendingChatIds)

  const { layoutMode } = useResponsive()
  // Desktop 和 Mobile 模式使用正常尺寸
  const isNormalSize = layoutMode === 'desktop' || layoutMode === 'mobile'

  const isSending = !!sendingChatIds[chatMeta.id]

  const {
    navigateToChat,
    clearChatIdParam,
  } = useNavigateToChat()

  // 使用自定义 hooks 替代 antd 的 App.useApp()
  const { modal } = useConfirm()

  // Shift 键按下状态
  const [isShiftDown, setIsShiftDown] = useState(false)
  // 鼠标悬停状态
  const [isHovering, setIsHovering] = useState(false)

  // 全局 keydown/keyup 追踪 Shift 键状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftDown(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 点击聊天列表按钮
  const onClickChat = (meta: ChatMeta) => {
    // 跳转到对应的聊天详情
    navigateToChat({
      chatId: meta.id,
    })
  }

  // 是否打开重命名的输入框
  const [isRenaming, setIsRenaming] = useState(false)

  // 临时的重命名
  const [newName, setNewName] = useState('')

  // 处理重命名操作
  const handleRename = () => {
    setIsRenaming(true)
    setNewName(chatMeta.name || '')
  }

  // 处理删除操作
  const handleDelete = () => {
    const onOk = async () => {
      try {
        await dispatch(deleteChat({
          // 从 activeChatData 获取完整聊天数据用于存储层标记 isDeleted
          chat: {
            id: chatMeta.id,
            name: chatMeta.name,
          } as any,
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
      title: `${t($ => $.chat.confirmDelete)}「${chatMeta.name || t($ => $.chat.unnamed)}」`,
      description: t($ => $.chat.deleteChatConfirm),
      onOk,
    })
  }

  // 快捷删除：跳过确认对话框直接执行删除
  const directDelete = async () => {
    try {
      await dispatch(deleteChat({
        chat: {
          id: chatMeta.id,
          name: chatMeta.name,
        } as any,
      }))
      toastQueue.success(t($ => $.chat.deleteChatSuccess))
      if (isSelected) {
        clearChatIdParam()
      }
    } catch {
      toastQueue.error(t($ => $.chat.deleteChatFailed))
    }
  }

  // 取消重命名
  const onCancelRename = () => {
    setIsRenaming(false)
  }

  // 确认重命名
  const onConfirmRename = () => {
    // 避免没有意义的编辑
    if (newName === chatMeta.name) {
      onCancelRename()
      return
    }

    try {
      dispatch(editChatName({
        id: chatMeta.id,
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
          maxLength={20}
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


  // 快捷删除按钮是否激活
  const isQuickDelete = isShiftDown && isHovering

  return (
    <div
      data-testid={`chat-button-${chatMeta.id}`}
      tabIndex={0}
      aria-selected={isSelected}
      data-variant={isNormalSize ? 'default' : 'compact'}
      className={`w-full flex justify-between rounded-none cursor-pointer
        ${
          isNormalSize
            ? 'py-2 px-1'
            : 'py-1.5 px-1'
        }
        ${isSelected ? 'bg-primary/20' : 'hover:bg-accent'}
        ${isRenaming && 'pl-1 pr-1'}
      `}
      onClick={() => onClickChat(chatMeta)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClickChat(chatMeta)
        }
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <span className="flex items-center flex-1 overflow-hidden min-w-0 pl-2">
        <span
          data-testid="chat-name"
          className={`truncate ${
            isNormalSize
              ? 'text-sm'
              : 'text-xs'
          }`}
        >
          {chatMeta.name || t($ => $.chat.unnamed)}
        </span>
      </span>
      {isQuickDelete ? (
        <Button
          variant="destructive"
          size="icon"
          aria-label={t($ => $.chat.shiftDeleteChat)}
          className={`p-0 shrink-0 ${
            isNormalSize
              ? 'h-8 w-8'
              : 'h-7 w-7'
          }`}
          onClick={(e) => {
            e.stopPropagation()
            directDelete()
          }}
        >
          <Trash2 className={`text-white ${
            isNormalSize
              ? 'h-4 w-4'
              : 'h-3.5 w-3.5'
          }`} />
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="chat-menu-trigger"
              aria-label={t($ => $.chat.moreActions)}
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
              disabled={isSending}
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
      )}
    </div>            e.stopPropagation()
            directDelete()
          }}
        >
          <Trash2 className={`text-white ${
            isNormalSize
              ? 'h-4 w-4'
              : 'h-3.5 w-3.5'
          }`} />
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="chat-menu-trigger"
              aria-label="更多操作"
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
              disabled={isSending}
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
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  const {
    id,
    name,
  } = prevProps.chatMeta
  const {
    id: nextId,
    name: nextName,
  } = nextProps.chatMeta

  return (
    id === nextId &&
    name === nextName &&
    prevProps.isSelected === nextProps.isSelected
  )
})


export default ChatButton
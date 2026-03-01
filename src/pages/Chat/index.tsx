import React, { useEffect, useState } from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatContent from './components/ChatContent';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useSearchParams } from 'react-router-dom';
import { useNavigateToChat } from '@/hooks/useNavigateToPage';
import { setSelectedChatId } from '@/store/slices/chatSlices';

const ChatPage: React.FC = () => {
  const isSidebarCollapsed = useAppSelector(state => state.chatPage.isSidebarCollapsed)

  // 获取聊天列表和加载状态
  const chatList = useAppSelector(state => state.chat.chatList)
  const loading = useAppSelector(state => state.chat.loading)
  const initializationError = useAppSelector(state => state.chat.initializationError)

  const dispatch = useAppDispatch()
  const { navigateToChat } = useNavigateToChat()
  const [searchParams] = useSearchParams();

  // 防止重定向循环的状态标记
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false)

  /**
   * @description 聊天重定向逻辑
   *
   * 当用户通过 URL 参数访问聊天时（例如 /chat?chatId=xxx），需要检查该聊天是否存在。
   * 如果聊天已被删除或不存在，则自动重定向到 /chat 页面，避免显示错误状态。
   *
   * 实现要点：
   * 1. 等待聊天列表加载完成后再执行检查（避免误判）
   * 2. 检查聊天是否存在且未被删除（chat.isDeleted === false）
   * 3. 使用 hasCheckedRedirect 状态防止重定向循环
   * 4. 使用 replace: true 替换浏览器历史记录，避免用户"后退"回到无效 URL
   */
  useEffect(() => {
    const chatId = searchParams.get('chatId')

    // 如果聊天列表正在加载，则等待加载完成后再检查
    // 原因：避免在聊天列表未加载完成时误判聊天不存在
    if (loading) {
      return
    }

    // 如果聊天列表加载失败，则不执行重定向检查
    // 原因：在错误状态下不应执行任何导航操作
    if (initializationError) {
      return
    }

    // 如果 URL 中没有 chatId 参数，则不执行检查
    // 原因：直接访问 /chat 页面是正常场景，不需要重定向
    if (!chatId) {
      return
    }

    // 如果已经检查过并执行了重定向，则不再重复检查
    // 原因：防止在组件重新渲染时重复执行重定向，导致无限循环
    if (hasCheckedRedirect) {
      // 正常设置选中的聊天 ID
      dispatch(setSelectedChatId(chatId))
      return
    }

    // 检查聊天是否存在于聊天列表中且未被删除
    // 注意：需要同时检查 chat.id 匹配和 chat.isDeleted === false
    const chatExists = chatList.some(chat => chat.id === chatId && !chat.isDeleted)

    if (chatExists) {
      // 聊天存在，正常设置选中的聊天 ID
      dispatch(setSelectedChatId(chatId))
    } else {
      // 聊天不存在（已删除或从未创建），重定向到 /chat 页面
      // 使用 replace: true 替换浏览器历史记录，避免用户"后退"回到无效 URL
      navigateToChat({ replace: true })
      // 标记已执行重定向，防止重复执行
      setHasCheckedRedirect(true)
    }
  }, [dispatch, searchParams, chatList, loading, initializationError, hasCheckedRedirect, navigateToChat])

  return (
    <div className="flex items-start justify-start w-full h-full overflow-hidden">
      {/* 可隐藏的侧边栏 */}
      <div
        className={`
          h-full overflow-hidden w-56 border-r border-gray-200 shrink-0
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? '-ml-56 -translate-x-full opacity-0' : 'ml-0 translate-x-0 opacity-100'}
        `}
      >
        <ChatSidebar />
      </div>
      {/* 主内容 */}
      <div
        className={`
          h-full grow overflow-x-auto transition-all duration-300 ease-in-out
        `}
      >
        <ChatContent />
      </div>
    </div>
  );
};

export default ChatPage;
import React, { useEffect } from "react";
import Sidebar from "@/pages/Chat/components/Sidebar";
import Content from "@/pages/Chat/components/Content";
import { MobileDrawer } from "@/components/MobileDrawer";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useSearchParams } from "react-router-dom";
import { useNavigateToChat } from "@/hooks/useNavigateToPage";
import { setSelectedChatIdWithPreload } from "@/store/slices/chatSlices";
import { setIsDrawerOpen } from "@/store/slices/chatPageSlices";
import { useResponsive } from "@/hooks/useResponsive";

const ChatPage: React.FC = () => {
  const isSidebarCollapsed = useAppSelector(
    (state) => state.chatPage.isSidebarCollapsed,
  );
  const isDrawerOpen = useAppSelector((state) => state.chatPage.isDrawerOpen);
  const { isDesktop, isMobile } = useResponsive();

  // 获取聊天元数据列表和加载状态
  const chatMetaList = useAppSelector((state) => state.chat.chatMetaList);
  const loading = useAppSelector((state) => state.chat.loading);
  const initializationError = useAppSelector(
    (state) => state.chat.initializationError,
  );

  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { clearChatIdParam } = useNavigateToChat();

  /**
   * @description 聊天重定向逻辑
   *
   * 当用户通过 URL 参数访问聊天时（例如 /chat?chatId=xxx），需要检查该聊天是否存在。
   * 如果聊天已被删除或不存在，则自动重定向到 /chat 页面，避免显示错误状态。
   *
   * 实现要点：
   * 1. 等待聊天列表加载完成后再执行检查（避免误判）
   * 2. 检查聊天是否存在且未被删除（chat.isDeleted === false）
   * 3. 使用 replace: true 替换浏览器历史记录，避免用户"后退"回到无效 URL
   */
  useEffect(() => {
    const chatId = searchParams.get("chatId");

    // 如果聊天列表正在加载，则等待加载完成后再检查
    // 原因：避免在聊天列表未加载完成时误判聊天不存在
    if (loading) {
      return;
    }

    // 如果聊天列表加载失败，则不执行重定向检查
    // 原因：在错误状态下不应执行任何导航操作
    if (initializationError) {
      return;
    }

    // 如果 URL 中没有 chatId 参数，则不执行检查
    // 原因：直接访问 /chat 页面是正常场景，不需要重定向
    if (!chatId) {
      return;
    }

    // 检查聊天是否存在于元数据列表中
    const chatMeta = chatMetaList.find((m) => m.id === chatId);

    if (chatMeta) {
      // 聊天存在，正常设置选中的聊天 ID 并预加载供应商 SDK
      dispatch(setSelectedChatIdWithPreload(chatId));
    } else {
      // 聊天不存在，清除 URL 中的 chatId 参数
      clearChatIdParam();
    }
  }, [
    dispatch,
    searchParams,
    chatMetaList,
    loading,
    initializationError,
    clearChatIdParam,
  ]);

  /**
   * @description 处理抽屉打开/关闭状态变化
   */
  const handleDrawerOpenChange = (open: boolean) => {
    dispatch(setIsDrawerOpen(open));
  };

  return (
    <div
      className="flex items-start justify-start w-full h-full overflow-hidden"
      data-testid="chat-page"
    >
      {/* Mobile 模式：抽屉 */}
      {isMobile && (
        <MobileDrawer
          isOpen={isDrawerOpen}
          onOpenChange={handleDrawerOpenChange}
          showCloseButton={false}
        >
          <Sidebar />
        </MobileDrawer>
      )}

      {/* 非 Mobile 模式：直接显示侧边栏 */}
      {!isMobile && (
        <aside
          data-testid="chat-sidebar"
          className={`
            h-full overflow-hidden border-r border-gray-200 shrink-0
            transition-spacing duration-300 ease-in-out
            will-change-transform will-change-opacity
            ${isSidebarCollapsed ? (isDesktop ? "-ml-56" : "-ml-48") + " -translate-x-full opacity-0" : "ml-0 translate-x-0 opacity-100"}
            ${isDesktop ? "w-56" : "w-48"}
          `}
          aria-label="聊天列表"
        >
          <Sidebar />
        </aside>
      )}

      {/* 主内容 */}
      <main
        data-testid="chat-content"
        className={`
          h-full grow overflow-x-auto
        `}
      >
        <Content />
      </main>
    </div>
  );
};

export default ChatPage;

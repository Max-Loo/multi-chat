import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useCreateChat } from "@/hooks/useCreateChat";
import {
  setIsCollapsed,
  setIsShowChatPage,
  toggleDrawer,
} from "@/store/slices/chatPageSlices";
import { PanelLeftOpen, Minus, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSelectedChat } from "@/pages/Chat/hooks/useSelectedChat";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";

interface HeaderProps {
  columnCount: number;
  setColumnCount: (value: number) => void;
  isSplitter: boolean;
  setIsSplitter: (value: boolean) => void;
}

/**
 * 聊天面板头部组件
 */
const Header: React.FC<HeaderProps> = ({
  columnCount,
  setColumnCount,
  isSplitter,
  setIsSplitter,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const { createNewChat } = useCreateChat();

  const isSidebarCollapsed = useAppSelector(
    (state) => state.chatPage.isSidebarCollapsed,
  );

  // 展开侧边栏
  const expandSidebar = () => {
    dispatch(setIsCollapsed(false));
  };

  // 打开抽屉
  const openDrawer = () => {
    dispatch(toggleDrawer());
  };

  const { selectedChat, chatModelList } = useSelectedChat();

  // 记录是否打开了具体聊天页面
  useEffect(() => {
    dispatch(setIsShowChatPage(true));
    return () => {
      dispatch(setIsShowChatPage(false));
    };
  }, [dispatch]);

  return (
    <div className="relative z-10 flex items-center justify-between w-full h-12 pl-3 pr-3 border-b border-gray-200" data-testid="chat-panel-header">
      <div className="flex items-center justify-start">
        {/* 打开聊天列表抽屉的按钮 */}
        {isMobile && (
          <Button
            variant="ghost"
            className="rounded mr-2 h-8 w-8 p-0"
            onClick={openDrawer}
            aria-label={t(($) => $.navigation.openChatList)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {isSidebarCollapsed && !isMobile && (
          <Button
            variant="ghost"
            className="rounded mr-2 h-8 w-8 p-0"
            title={t(($) => $.chat.showSidebar)}
            onClick={expandSidebar}
          >
            <PanelLeftOpen size={16} />
          </Button>
        )}
        <span className="text-base">
          {selectedChat?.name || t(($) => $.chat.unnamed)}
        </span>
      </div>
      <div className="flex items-center">
        {chatModelList.length > 1 && !isMobile && (
          <div className="flex items-center justify-start text-sm">
            <span>{t(($) => $.chat.enableSplitter)}</span>
            <Switch
              checked={isSplitter}
              onCheckedChange={setIsSplitter}
              className="mr-2"
              data-testid="splitter-switch"
            />
            <span>{t(($) => $.chat.maxPerRow)}</span>
            <Input
              type="number"
              className="w-16 h-8"
              data-testid="column-count-input"
              min={1}
              max={chatModelList.length || 1}
              value={columnCount}
              onChange={(e) =>
                setColumnCount(Number(e.target.value) || chatModelList.length)
              }
            />
            <span className="ml-1">{t(($) => $.chat.itemsUnit)}</span>
            <Button
              variant="ghost"
              className="ml-1 h-8 w-8 p-0"
              data-testid="column-plus-btn"
              disabled={columnCount >= chatModelList.length}
              onClick={() => setColumnCount(columnCount + 1)}
            >
              <Plus size={16} />
            </Button>
            <Button
              variant="ghost"
              className="ml-1 h-8 w-8 p-0"
              data-testid="column-minus-btn"
              disabled={columnCount <= 1}
              onClick={() => setColumnCount(columnCount - 1)}
            >
              <Minus size={16} />
            </Button>
          </div>
        )}

        {isMobile && (
          <Button
            variant="ghost"
            className="rounded h-7 w-7 p-0"
            onClick={createNewChat}
            title={t(($) => $.chat.createChat)}
            aria-label={t(($) => $.navigation.createChat)}
          >
            <Plus size={15} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;

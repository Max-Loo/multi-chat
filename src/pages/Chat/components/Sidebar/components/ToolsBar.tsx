import FilterInput from "@/components/FilterInput";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useCreateChat } from "@/hooks/useCreateChat";
import { setIsCollapsed } from "@/store/slices/chatPageSlices";
import { ArrowLeft, PanelLeftClose, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isString } from "es-toolkit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";

interface ToolsBarProps {
  filterText?: string;
  onFilterChange?: (value: string) => void;
}

const ToolsBar: React.FC<ToolsBarProps> = ({
  filterText,
  onFilterChange = () => {},
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const isShowChatPage = useAppSelector(
    (state) => state.chatPage.isShowChatPage,
  );

  const { layoutMode } = useResponsive();
  // Desktop 和 Mobile 模式使用正常尺寸
  const isNormalSize = layoutMode === 'desktop' || layoutMode === 'mobile';
  // 非 Mobile 模式（Desktop、Compact、Compressed）显示隐藏侧边栏按钮
  const isNonMobile = layoutMode !== 'mobile';
  const { createNewChat } = useCreateChat();

  // 是否展示搜索状态
  const [isSearching, setIsSearching] = useState(false);

  if (isSearching) {
    // 点击返回退出搜索
    const quitSearch = () => {
      setIsSearching(false);
      // 重置搜索的关键字
      onFilterChange("");
    };

    // 当开启搜索的时候，变更渲染内容
    return (
      <div className="flex items-center justify-between w-full" data-testid="tools-bar">
        <Button
          variant="ghost"
          className={`rounded-lg p-1 ${isNormalSize ? "h-8 w-8" : "h-7 w-7"}`}
          onClick={quitSearch}
          aria-label={t(($) => $.common.search)}
        >
          <ArrowLeft size={isNormalSize ? 16 : 15} />
        </Button>
        <FilterInput
          value={filterText || ""}
          onChange={(value) => {
            onFilterChange(value);
          }}
          className={`w-fit ml-2`}
          autoFocus
        />
      </div>
    );
  }

  // 隐藏聊天页侧边栏
  const collapseSidebar = () => {
    dispatch(setIsCollapsed(true));
  };

  return (
    <div
      className={`flex items-center justify-between w-full ${
        isNormalSize ? "" : "gap-1"
      }`}
      data-testid="tools-bar"
    >
      {isShowChatPage && isNonMobile ? (
        <Button
          variant="ghost"
          className={`rounded p-0 ${isNormalSize ? "h-8 w-8" : "h-7 w-7"}`}
          title={t(($) => $.chat.hideSidebar)}
          aria-label={t(($) => $.chat.hideSidebar)}
          onClick={collapseSidebar}
        >
          <PanelLeftClose size={isNormalSize ? 16 : 15} />
        </Button>
      ) : (
        <div></div>
      )}
      <div className={`flex ${isNormalSize ? "" : "gap-1"}`}>
        {isString(filterText) && (
          <Button
            variant="ghost"
            className={`rounded-lg p-0 ${isNormalSize ? "h-8 w-8" : "h-7 w-7"}`}
            title={t(($) => $.common.search)}
            aria-label={t(($) => $.common.search)}
            data-testid="search-button"
            onClick={() => setIsSearching(true)}
          >
            <Search size={isNormalSize ? 16 : 15} />
          </Button>
        )}
        {/* 新增聊天按钮 */}
        {isNonMobile && (
          <Button
            variant="ghost"
            className={`rounded-lg p-0 ml-1 ${
              isNormalSize ? "h-8 w-8" : "h-7 w-7"
            }`}
            data-testid="create-chat-button"
            onClick={createNewChat}
            title={t(($) => $.chat.createChat)}
            aria-label={t(($) => $.chat.createChat)}
          >
            <Plus size={isNormalSize ? 16 : 15} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ToolsBar;

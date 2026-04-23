import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { ReactNode } from "react";
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import { isNotNil } from 'es-toolkit';
import { useNavigateToChat } from '@/hooks/useNavigateToPage';
import { useTranslation } from 'react-i18next';
import { NAVIGATION_ITEMS } from '@/config/navigation';

interface SidebarProps {
  className?: string;
}

interface NavigationItem {
  id: string;
  name: string;
  icon: ReactNode;
  path: string;
  // 提前构建好 classname，避免在 render 中动态拼接
  baseClassName: string;
  activeClassName: string;
  inactiveClassName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedChat = useCurrentSelectedChat()
  const {
    navigateToChat,
  } = useNavigateToChat()

  const navigationItems = useMemo<NavigationItem[]>(() => {
    return NAVIGATION_ITEMS.map((item) => {
      // 配置中的图标已经是渲染好的 React 元素
      const icon = item.icon as ReactNode;

      return {
        id: item.id,
        name: t(item.i18nKey as any),
        icon,
        path: item.path,
        baseClassName: item.theme.base,
        activeClassName: item.theme.active,
        inactiveClassName: item.theme.inactive,
      };
    });
  }, [t]);

  const handleNavigation = (item: NavigationItem) => {
    // 就在当前页面就不用跳转
    if (location.pathname === item.path) return

    // 处理记忆「上一次点击查看的聊天」
    if (item.path === '/chat' && isNotNil(selectedChat)) {
      navigateToChat({
        chatId: selectedChat.id,
      })
      return
    }

    navigate(item.path);
  };


  return (
    <div className={`w-auto h-full bg-gray-50 border-r border-gray-200 ${className}`} data-testid="sidebar">
      <div className="flex flex-col items-center py-4 space-y-2">
        {navigationItems.map((item) => {
          const {
            id,
            icon,
            baseClassName,
            activeClassName,
            inactiveClassName,
          } = item

          // 检查是否是当前激活的路由图标
          const isActive = location.pathname.startsWith(item.path)

          return (
            <Button
              key={id}
              variant="ghost"
              title={item.name}
              onClick={() => handleNavigation(item)}
              className={`
                flex items-center justify-center
                ml-1 mr-1 w-10 h-10 text-xl rounded-xl
                [&_svg]:size-5
                ${baseClassName} ${isActive ? activeClassName : inactiveClassName}
              `}
            >
              {icon}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
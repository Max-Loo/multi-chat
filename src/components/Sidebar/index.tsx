import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { MessageOutlined, RobotOutlined, SettingOutlined } from '@ant-design/icons';
import { ReactNode } from "react";
import { useCurrentSelectedChat } from '@/hooks/useCurrentSelectedChat';
import { isNotNil } from 'es-toolkit';
import { useNavigateToChat } from '@/hooks/useNavigateToPage';
import { useTranslation } from 'react-i18next';

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
};

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedChat = useCurrentSelectedChat()
  const {
    navigateToChat,
  } = useNavigateToChat()

  const navigationItems = useMemo<NavigationItem[]>(() => {
    return [
      {
        id: 'chat',
        name: t($ => $.navigation.chat),
        icon: <MessageOutlined />,
        path: '/chat',
        // 预构建类，因为 tailwindcss 不支持动态类名
        baseClassName: `text-blue-400!`,
        activeClassName: `bg-blue-100! text-blue-500!`,
        inactiveClassName: `hover:text-blue-500! hover:bg-blue-100!`,
      },
      {
        id: 'model',
        name: t($ => $.navigation.model),
        icon: <RobotOutlined />,
        path: '/model',
        baseClassName: `text-emerald-400!`,
        activeClassName: `bg-emerald-100! text-emerald-500!`,
        inactiveClassName: `hover:text-emerald-500! hover:bg-emerald-100!`,
      },
      {
        id: 'setting',
        name: t($ => $.navigation.setting),
        icon: <SettingOutlined />,
        path: '/setting',
        baseClassName: `text-violet-400!`,
        activeClassName: `bg-violet-100! text-violet-500!`,
        inactiveClassName: `hover:text-violet-500! hover:bg-violet-100!`,
      },
    ]
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
    <div className={`w-auto h-full bg-gray-50 border-r border-gray-200 ${className}`}>
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
              type="text"
              title={item.name}
              icon={icon}
              onClick={() => handleNavigation(item)}
              className={`
                flex items-center justify-center
                ml-1 mr-1 w-10! h-10! text-xl! rounded-xl!
                ${baseClassName} ${isActive ? activeClassName : inactiveClassName}
              `}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
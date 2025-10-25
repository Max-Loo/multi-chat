import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'antd';
import { MessageOutlined, RobotOutlined } from '@ant-design/icons';
import type { NavigationItem } from '@/types/navigation';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      id: 'chat',
      name: '聊天',
      icon: <MessageOutlined />,
      path: '/chat',
      color: 'text-blue-500',
    },
    {
      id: 'model',
      name: '模型',
      icon: <RobotOutlined />,
      path: '/model',
      color: 'text-purple-500',
    },
  ];

  const handleNavigation = (item: NavigationItem) => {
    // 就在当前页面就不用跳转
    if (location.pathname === item.path) return

    navigate(item.path);
  };

  // 判断当前选中的按钮是哪个
  const isActive = (item: NavigationItem) => {
    return location.pathname.startsWith(item.path)
  };

  return (
    <div className={`w-auto h-full bg-gray-50 border-r border-gray-200 ${className}`}>
      <div className="flex flex-col items-center py-4 space-y-2">
        {navigationItems.map((item) => {
          const active = isActive(item);
          return (
            <Button
              key={item.id}
              type="text"
              icon={item.icon}
              onClick={() => handleNavigation(item)}
              className={`flex items-center justify-center transition-all duration-200 ml-1 mr-1 !w-10 !h-10 !text-xl !rounded-xl ${
                active
                  ? '!bg-blue-50 !border-2 !border-blue-500 !shadow-sm !text-blue-500'
                  : '!border-2 !border-transparent hover:!bg-gray-300'
              }`}
              title={item.name}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
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
    navigate(item.path);
  };

  const isActive = (item: NavigationItem) => {
    return location.pathname === item.path;
  };

  return (
    <div className={`w-[50px] h-full bg-gray-50 border-r border-gray-200 ${className}`}>
      <div className="flex flex-col items-center py-4 space-y-2">
        {navigationItems.map((item) => {
          const active = isActive(item);
          return (
            <Button
              key={item.id}
              type="text"
              icon={item.icon}
              onClick={() => handleNavigation(item)}
              className={`w-[40px] h-[40px] flex items-center justify-center transition-all duration-200 ${
                active
                  ? '!bg-blue-50 !border-2 !border-blue-500 !shadow-sm'
                  : '!border-2 !border-transparent hover:!bg-gray-100'
              }`}
              title={item.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '20px',
                color: active ? '#2563eb' : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
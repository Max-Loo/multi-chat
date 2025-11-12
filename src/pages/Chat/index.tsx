import React from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatContent from './components/ChatContent';
import { useAppSelector } from '@/hooks/redux';

const ChatPage: React.FC = () => {
  const {
    isSidebarCollapsed,
  } = useAppSelector(state => state.chatPage)

  return (
    <div className="flex items-start justify-start w-full h-full">
      {/* 可隐藏的侧边栏 */}
      <div
        className={`
          h-full overflow-hidden transition-all duration-300 ease-in-out shrink-0
          ${isSidebarCollapsed ? 'w-0' : 'w-56 border-r border-gray-200'}
        `}
      >
        <ChatSidebar />
      </div>
      {/* 主内容 */}
      <div
        className={`
          h-full grow overflow-x-auto
        `}>
        <ChatContent />
      </div>
    </div>
  );
};

export default ChatPage;
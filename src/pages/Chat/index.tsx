import React from 'react';
import ChatSidebar from './components/ChatSidebar';
import ChatContent from './components/ChatContent';

const ChatPage: React.FC = () => {

  return (
    <div className="flex items-start justify-start h-full">
      <div className="h-full border-r border-gray-200">
        <ChatSidebar />
      </div>
      <div className="w-full h-full p-4">
        <ChatContent />
      </div>
    </div>
  );
};

export default ChatPage;
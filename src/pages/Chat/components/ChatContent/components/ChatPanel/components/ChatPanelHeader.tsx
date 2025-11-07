import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setIsCollapsed } from "@/store/slices/chatSlices";
import { Chat, ChatModel } from "@/types/chat"
import { MenuUnfoldOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, InputNumber } from "antd";

interface ChatPanelHeaderProps {
  selectedChat: Chat;
  chatModelList: ChatModel[];
  columnCount: number;
  setColumnCount: (value: number) => void;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelHeader: React.FC<ChatPanelHeaderProps> = ({
  selectedChat,
  chatModelList,
  columnCount,
  setColumnCount,
}) => {
  const dispatch = useAppDispatch()

  const {
    isSidebarCollapsed,
  } = useAppSelector(state => state.chat)

  // 展开侧边栏
  const expandSidebar = () => {
    dispatch(setIsCollapsed(false))
  }

  return (<div className="flex items-center justify-between w-full">
    <div className="flex items-center justify-start">
      {isSidebarCollapsed && <Button
        className={`
          rounded-lg! pr-5! pl-5! mr-2
        `}
        icon={<MenuUnfoldOutlined />}
        onClick={expandSidebar}
      />}
      <span
        className="text-lg"
      >
        {selectedChat.name || '未命名'}
      </span>
    </div>
    {chatModelList.length > 1 && <div className="flex items-center justify-start">
      <span>每行至多展示：</span>
      <InputNumber
        controls={false}
        className="w-10!"
        min={1}
        max={chatModelList.length || 1}
        value={columnCount}
        onChange={(value) => setColumnCount(value || chatModelList.length)}
      />
      <span className="ml-1">个</span>
      <Button
        icon={<PlusOutlined />}
        className="ml-1"
        disabled={columnCount >= chatModelList.length}
        onClick={() => setColumnCount(columnCount + 1)}
      />
      <Button
        icon={<MinusOutlined />}
        className="ml-1"
        disabled={columnCount <= 1}
        onClick={() => setColumnCount(columnCount - 1)}
      />
    </div>}
  </div>)
}


export default ChatPanelHeader
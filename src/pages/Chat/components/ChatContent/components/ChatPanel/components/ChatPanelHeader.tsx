import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setIsCollapsed, setIsShowChatPage } from "@/store/slices/chatPageSlices";
import { MenuUnfoldOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, InputNumber } from "antd";
import { useTypedSelectedChat } from "../hooks/useTypedSelectedChat";
import { useEffect } from "react";

interface ChatPanelHeaderProps {
  columnCount: number;
  setColumnCount: (value: number) => void;
}

/**
 * @description 聊天详情页的头部
 */
const ChatPanelHeader: React.FC<ChatPanelHeaderProps> = ({
  columnCount,
  setColumnCount,
}) => {
  const dispatch = useAppDispatch()

  const {
    isSidebarCollapsed,
  } = useAppSelector(state => state.chatPage)

  // 展开侧边栏
  const expandSidebar = () => {
    dispatch(setIsCollapsed(false))
  }

  const {
    selectedChat,
    chatModelList,
  } = useTypedSelectedChat()

  // 记录是否打开了具体聊天页面
  useEffect(() => {
    dispatch(setIsShowChatPage(true))
    return () => {
      dispatch(setIsShowChatPage(false))
    }
  }, [dispatch])

  return (
    <div className="flex items-center justify-between w-full h-12 pl-3 pr-3 border-b border-gray-200">
      <div className="flex items-center justify-start">
        {isSidebarCollapsed && <Button
          className={`
          rounded-lg! pr-5! pl-5! mr-2
        `}
          icon={<MenuUnfoldOutlined />}
          onClick={expandSidebar}
        />}
        <span
          className="text-base"
        >
          {selectedChat.name || '未命名'}
        </span>
      </div>
      {chatModelList.length > 1 && <div className="flex items-center justify-start text-sm">
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
    </div>
  )
}


export default ChatPanelHeader
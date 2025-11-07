import { Button, Input } from "antd"

const ChatPanelSender: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-full h-24 p-4 bg-gray-50">
      <Input.TextArea
        className="relative w-full text-base! bg-white border border-gray-300 rounded-xl"
        autoSize={{ minRows: 2, maxRows: 10 }}
      >
      </Input.TextArea>
      <Button className="w-10! h-10! relative flex items-center justify-center border-0! rounded-full!">
        <div
          className={`
            absolute inset-0 border-4 rounded-full
            border-blue-300 border-t-blue-500 
            animate-spin w-full h-full
          `}
        ></div>
        <div className="flex items-center justify-center w-full h-full rounded-full">
          <span>静止</span>
        </div>
      </Button>
    </div>
  )
}

export default ChatPanelSender
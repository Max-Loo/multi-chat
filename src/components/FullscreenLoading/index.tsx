import { Spin } from "antd"

const FullscreenLoading: React.FC = () => {
  return <div className="flex items-center justify-center w-full h-dvh">
    <Spin size="large" />
  </div>
}

export default FullscreenLoading
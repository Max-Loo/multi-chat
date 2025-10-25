/**
 * 可以点击打开外部浏览器的按钮
 */

import { ExportOutlined } from "@ant-design/icons"
import { open } from "@tauri-apps/plugin-shell"
import { Button } from "antd"

interface ButtonProps {
  // 要打开的网址
  siteUrl: string | undefined
  className?: string
}

const OpenExternalBrowserButton: React.FC<ButtonProps> = ({
  siteUrl,
  className = '',
}) => {

  if (!siteUrl) {
    return <></>
  }

  // 跳转到外部网站
  const navToOfficialSite = () => {
    open(siteUrl)
  }

  return (
    <Button
      type="text"
      className={`${className}`}
      icon={<ExportOutlined />}
      onClick={navToOfficialSite}
    />
  )
}


export default OpenExternalBrowserButton
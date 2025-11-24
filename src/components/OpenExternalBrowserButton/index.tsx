/**
 * 可以点击打开外部浏览器的按钮
 */

import { useNavigateToExternalSite } from "@/hooks/useNavigateToExternalSite"
import { ExportOutlined } from "@ant-design/icons"
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

  const {
    navToExternalSite,
  } = useNavigateToExternalSite()

  if (!siteUrl) {
    return <></>
  }

  // 跳转到外部网站
  const navToOfficialSite = () => {
    navToExternalSite(siteUrl)
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
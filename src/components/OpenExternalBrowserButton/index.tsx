/**
 * 可以点击打开外部浏览器的按钮
 */

import { useNavigateToExternalSite } from "@/hooks/useNavigateToExternalSite"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

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
      variant="ghost"
      className={className}
      onClick={navToOfficialSite}
    >
      <ExternalLink className="h-4 w-4" />
    </Button>
  )
}


export default OpenExternalBrowserButton
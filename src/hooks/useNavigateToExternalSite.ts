import { shell } from "@/utils/tauriCompat"

/**
 * @description 利用打开外部浏览器网页
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    shell.open(siteUrl)
  }

  return {
    navToExternalSite,
  }
}
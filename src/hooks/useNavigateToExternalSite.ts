import { openExternal } from "@/utils/openExternal"

/**
 * @description 利用打开外部浏览器网页
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    openExternal(siteUrl)
  }

  return {
    navToExternalSite,
  }
}
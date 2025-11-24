import { open } from "@tauri-apps/plugin-shell"

/**
 * @description 利用打开外部浏览器网页
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    open(siteUrl)
  }

  return {
    navToExternalSite,
  }
}
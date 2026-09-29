/**
 * @description 利用浏览器原生能力打开外部网页（新标签页）
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    window.open(siteUrl, '_blank', 'noopener,noreferrer')
  }

  return {
    navToExternalSite,
  }
}

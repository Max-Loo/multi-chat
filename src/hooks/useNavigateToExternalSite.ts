/**
 * @description 利用打开外部浏览器网页
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    window.open(siteUrl, '_blank', 'noopener,noreferrer')
  }

  return {
    navToExternalSite,
  }
}

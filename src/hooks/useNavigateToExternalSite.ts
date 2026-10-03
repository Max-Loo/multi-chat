/**
 * @description 利用浏览器打开外部网页（新标签页，防止反向标签页劫持）
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    window.open(siteUrl, "_blank", "noopener,noreferrer");
  }

  return {
    navToExternalSite,
  }
}

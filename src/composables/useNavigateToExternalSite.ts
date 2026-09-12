/**
 * @description 用于打开外部浏览器网页（Vue 版 useNavigateToExternalSite）
 */
export const useNavigateToExternalSite = () => {
  const navToExternalSite = (siteUrl: string) => {
    window.open(siteUrl, '_blank', 'noopener,noreferrer');
  };

  return {
    navToExternalSite,
  };
};

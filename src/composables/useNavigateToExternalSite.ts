/**
 * @description 用于打开外部浏览器网页（Vue 版 useNavigateToExternalSite）
 */

/** 新标签页打开外部链接（不与调用方作用域产生依赖，置于模块顶层避免重复创建） */
const navToExternalSite = (siteUrl: string) => {
  window.open(siteUrl, '_blank', 'noopener,noreferrer');
};

export const useNavigateToExternalSite = () => {
  return {
    navToExternalSite,
  };
};

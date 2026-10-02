/**
 * 打开外部链接组合式函数（对应旧版 hooks/useNavigateToExternalSite.ts）
 * 纯 Web 实现：window.open 新标签页打开
 */
import { shell } from '@/utils/tauriCompat/shell';

export const useNavigateToExternalSite = () => {
  /**
   * 跳转到外部网站（新标签页）
   */
  const navToExternalSite = (siteUrl: string): void => {
    shell.open(siteUrl);
  };

  return {
    navToExternalSite,
  };
};

import { Middleware } from '@reduxjs/toolkit';
import { LOCAL_STORAGE_LANGUAGE_KEY } from '@/lib/global';

/**
 * 创建语言持久化中间件
 * 监听语言变更 action，自动同步到 localStorage
 * @returns Redux Middleware
 */
export const createLanguagePersistenceMiddleware = (): Middleware => {
  return (_store) => (next) => (action: any) => {
    const result = next(action);

    // 使用 endsWith 匹配，兼容 Redux Toolkit 的环境前缀
    if (action.type.endsWith('/setAppLanguage')) {
      // 类型安全检查
      if (typeof action.payload === 'string') {
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, action.payload);
        } catch (error) {
          console.warn('[LanguagePersistence] 持久化失败:', error);
          // 静默降级，不抛出错误
        }
      } else {
        console.warn('[LanguagePersistence] 无效的语言代码:', action.payload);
      }
    }

    return result;
  };
};

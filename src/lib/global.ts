import { LOCAL_STORAGE_PREFIX, SUPPORTED_LANGUAGE_LIST } from '@/utils/constants';
import { locale, shell } from '@/utils/tauriCompat';

/**
 * 拦截全局的 a 标签跳转页面事件
 */
export const interceptClickAToJump = () => {
// 全局事件委托，省得给每个 <a> 绑监听
  document.addEventListener('click', async (event) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');

    if (anchor?.href) {
      const url = new URL(anchor.href);
      // 判断是否是外部链接（非本地路由）
      if (url.origin !== window.location.origin) {
        event.preventDefault();
        await shell.open(url.href);
      }
    }
  });
}


// 储存在本地的「语言」的 key
export const LOCAL_STORAGE_LANGUAGE_KEY = LOCAL_STORAGE_PREFIX + 'language'

/**
 * 获取默认的应用语言
 * @returns Promise<string>
 */
export const getDefaultAppLanguage = async (): Promise<string> => {
  // 第一优先级：取上传存在 localStorage 里面的值
  const localStorageLang = window?.localStorage?.getItem(LOCAL_STORAGE_LANGUAGE_KEY)
  if (localStorageLang) {
    return localStorageLang
  }

  // 第二优先级：通过 tauri 取系统的值
  const systemLocale = await locale()

  if (systemLocale) {
    const systemLang = systemLocale.split('-')[0]
    console.log(systemLocale, systemLang);
    // 判断当前系统语言是否已经被支持
    if (SUPPORTED_LANGUAGE_LIST.includes(systemLang)) {
      return systemLang
    }
  }


  // 兜底逻辑：en 语言
  return 'en'
}
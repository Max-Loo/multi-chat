import { LOCAL_STORAGE_PREFIX, LANGUAGE_MIGRATION_MAP, SUPPORTED_LANGUAGE_SET, SUPPORTED_LANGUAGE_MAP } from '@/utils/constants';
import { locale, shell } from '@/utils/tauriCompat';

/**
 * 语言检测结果接口
 * 包含最终使用的语言代码和迁移信息
 */
export interface LanguageResult {
  /** 最终使用的语言代码 */
  lang: string
  /** 是否执行了迁移 */
  migrated: boolean
  /** 迁移前的语言代码（如果 migrated 为 true） */
  from?: string
  /** 降级原因 */
  fallbackReason?: 'cache-invalid' | 'system-lang' | 'default'
}

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
 * @returns Promise<LanguageResult>
 */
export const getDefaultAppLanguage = async (): Promise<LanguageResult> => {
  try {
    // 第一优先级：取上次存在 localStorage 里面的值
    const localStorageLang = window?.localStorage?.getItem(LOCAL_STORAGE_LANGUAGE_KEY)
    
    if (localStorageLang) {
      // 验证缓存语言是否有效
      if (SUPPORTED_LANGUAGE_SET.has(localStorageLang)) {
        // 缓存语言有效，直接使用
        return { lang: localStorageLang, migrated: false }
      }
      
      // 缓存语言无效，检查是否存在迁移规则
      const migrationTarget = LANGUAGE_MIGRATION_MAP[localStorageLang]
      if (migrationTarget) {
        // 验证迁移目标是否有效
        if (SUPPORTED_LANGUAGE_SET.has(migrationTarget)) {
          // 迁移目标有效，执行迁移
          try {
            window?.localStorage?.setItem(LOCAL_STORAGE_LANGUAGE_KEY, migrationTarget)
          } catch (writeError) {
            // 写入失败，仅在内存中更新
            console.warn(`Failed to update localStorage language cache: ${writeError}`)
          }
          return { 
            lang: migrationTarget, 
            migrated: true, 
            from: localStorageLang 
          }
        } else {
          // 迁移目标无效，删除缓存并降级
          try {
            window?.localStorage?.removeItem(LOCAL_STORAGE_LANGUAGE_KEY)
          } catch (removeError) {
            console.warn(`Failed to remove invalid language cache: ${removeError}`)
          }
        }
      } else {
        // 不存在迁移规则，删除无效缓存
        try {
          window?.localStorage?.removeItem(LOCAL_STORAGE_LANGUAGE_KEY)
        } catch (removeError) {
          console.warn(`Failed to remove invalid language cache: ${removeError}`)
        }
      }
    }

    // 第二优先级：通过 tauri 取系统的值
    const systemLocale = await locale()

    if (systemLocale) {
      const systemLang = systemLocale.split('-')[0]
      // 判断当前系统语言是否已经被支持
      if (SUPPORTED_LANGUAGE_SET.has(systemLang)) {
        return { 
          lang: systemLang, 
          migrated: false, 
          fallbackReason: 'system-lang' 
        }
      }
    }

    // 兜底逻辑：en 语言
    return { 
      lang: 'en', 
      migrated: false, 
      fallbackReason: 'default' 
    }
  } catch (error) {
    // 任何异常都降级到系统语言或英文
    console.warn(`Error getting default app language: ${error}`)
    try {
      const systemLocale = await locale()
      if (systemLocale) {
        const systemLang = systemLocale.split('-')[0]
        if (SUPPORTED_LANGUAGE_SET.has(systemLang)) {
          return { 
            lang: systemLang, 
            migrated: false, 
            fallbackReason: 'system-lang' 
          }
        }
      }
    } catch (localeError) {
      console.warn(`Error getting system locale: ${localeError}`)
    }
    
    return {
      lang: 'en',
      migrated: false,
      fallbackReason: 'default'
    }
  }
}

/**
 * 获取语言的显示标签
 * @param lang 语言代码
 * @returns 语言的显示标签，如果语言代码不在支持列表中则返回原代码
 */
export const getLanguageLabel = (lang: string): string => {
  return SUPPORTED_LANGUAGE_MAP.get(lang)?.label || lang;
}
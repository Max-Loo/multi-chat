import i18n, { Resource, TFunction } from "i18next";
import { initReactI18next } from "react-i18next";
import { getDefaultAppLanguage, getLanguageLabel } from "./global";
import { toastQueue } from "./toast/toastQueue";
import { logger } from '@/utils/logger';

// 英文资源"第一公民"策略（静态导入，同步打包）
import enCommon from "../locales/en/common.json";
import enChat from "../locales/en/chat.json";
import enModel from "../locales/en/model.json";
import enNavigation from "../locales/en/navigation.json";
import enProvider from "../locales/en/provider.json";
import enSetting from "../locales/en/setting.json";
import enTable from "../locales/en/table.json";
import enError from "../locales/en/error.json";

// 英文资源聚合对象
const EN_RESOURCES: Record<string, unknown> = {
  common: enCommon,
  chat: enChat,
  model: enModel,
  navigation: enNavigation,
  provider: enProvider,
  setting: enSetting,
  table: enTable,
  error: enError,
};

// 使用 Set 和 Map 缓存语言加载状态
const loadedLanguages = new Set<string>(["en"]); // 英文预标记为已加载
const loadingPromises = new Map<string, Promise<void>>();

// 缓存已加载的语言资源对象（不包含 translation 包装）
const languageResourcesCache = new Map<string, Record<string, unknown>>();
languageResourcesCache.set("en", EN_RESOURCES);

// Vite import.meta.glob 预先获取所有语言文件映射（排除英文，因为已静态加载）
const allLocaleModules = import.meta.glob("../locales/!(en)/**/*.json");

/**
 * 加载指定语言的资源
 * @param lang 语言代码（如 'zh', 'fr'）
 * @param retries 重试次数（默认 2 次）
 * @returns Promise<void>
 */
const loadLanguage = async (lang: string, retries = 2): Promise<void> => {
  // 缓存检查逻辑
  if (loadedLanguages.has(lang)) {
    return; // 已加载，直接返回
  }

  // 检查是否正在加载（避免竞态条件）
  if (loadingPromises.has(lang)) {
    return loadingPromises.get(lang)!; // 复用进行中的 Promise
  }

  // 创建加载 Promise 并存储到 Map
  const loadPromise = (async () => {
    try {
      const resources = await performLoad(lang, retries);
      loadedLanguages.add(lang);
      languageResourcesCache.set(lang, resources);

      // 如果 i18n 已经初始化，动态添加资源
      if (i18n.isInitialized) {
        // 资源格式：{ lang: { translation: { namespace1: {...}, ... } } }
        i18n.addResourceBundle(lang, "translation", resources, true);
      }
    } finally {
      loadingPromises.delete(lang);
    }
  })();

  loadingPromises.set(lang, loadPromise);
  return loadPromise;
};

/**
 * 执行语言资源加载（内部函数，处理重试逻辑）
 * @param lang 语言代码
 * @param retries 重试次数
 * @returns Promise<Record<string, unknown>> 返回聚合后的语言资源对象
 */
const performLoad = async (
  lang: string,
  retries: number,
): Promise<Record<string, unknown>> => {
  // 英文资源已静态加载，直接返回空对象
  if (lang === "en") {
    return EN_RESOURCES;
  }

  // 指数退避重试逻辑
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 过滤出目标语言的文件（排除英文，因为已静态加载）
      const langFiles = Object.keys(allLocaleModules).filter((path) =>
        path.match(new RegExp(`/locales/${lang}/[^/]+\\.json$`)),
      );

      if (langFiles.length === 0) {
        throw new Error(`Language ${lang} not found`);
      }

      // 并行加载所有命名空间
      const resources = await Promise.all(
        langFiles.map(async (filePath) => {
          const module = (await allLocaleModules[filePath]()) as {
            default: Record<string, unknown>;
          };
          // 提取命名空间（文件名）
          const namespaceMatch = filePath.match(/\/([^/]+)\.json$/);
          if (!namespaceMatch) {
            throw new Error(`Invalid file path: ${filePath}`);
          }
          const namespace = namespaceMatch[1];
          return { namespace, resources: module.default };
        }),
      );

      // 聚合为 i18next 格式
      const aggregatedResources = resources.reduce(
        (acc, { namespace, resources: namespaceResources }) => {
          acc[namespace] = namespaceResources;
          return acc;
        },
        {} as Record<string, unknown>,
      );

      // 成功加载后将语言代码添加到缓存（在 loadLanguage 中处理）
      return aggregatedResources;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const isNetworkError =
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("timeout");

      // 非网络错误或已达重试上限，直接失败
      if (!isNetworkError || attempt === retries) {
        throw error;
      }

      // 指数退避：第一次 1s，第二次 2s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // 理论上不会执行到这里
  throw new Error(`Failed to load language ${lang} after ${retries} retries`);
};

/**
 * @deprecated 此函数已废弃，仅用于向后兼容
 * 从 i18next 实例读取已加载的资源快照
 * @returns {Record<string, { translation: Record<string, unknown> }>} 已加载的语言资源对象
 */
export const getLocalesResources = (): Record<
  string,
  { translation: Record<string, unknown> }
> => {
  // 从 i18next 实例读取已加载的资源（向后兼容）
  const resources: Record<string, { translation: Record<string, unknown> }> =
    {};

  const languages = i18n.languages || [];
  for (const lang of languages) {
    const resource = i18n.getResourceBundle(lang, "translation");
    if (resource) {
      resources[lang] = { translation: resource as Record<string, unknown> };
    }
  }

  return resources;
};

type InitI18nPromise = Promise<TFunction<"translation", undefined>>;

// 初始化 i18n 的 Promise
let initI18nPromise: InitI18nPromise | null = null;

/**
 * 重置 i18n 初始化单例（仅用于测试）
 * @internal
 */
export const resetInitI18nForTest = () => {
  initI18nPromise = null;
};

/**
 * 初始化 i18n 配置
 * 不接受参数，内部检测系统语言并自动切换
 */
export const initI18n = async () => {
  // 实现单例模式
  if (initI18nPromise) {
    return initI18nPromise;
  }

  initI18nPromise = (async () => {
    // 内部调用 getDefaultAppLanguage() 检测系统语言
    let languageResult: Awaited<ReturnType<typeof getDefaultAppLanguage>> = {
      lang: "en",
      migrated: false,
    }; // 默认英文
    try {
      languageResult = await getDefaultAppLanguage();
    } catch (error) {
      logger.warn("获取系统语言失败，使用英语", error instanceof Error ? error : undefined, {
        action: "initI18n",
      });
    }

    // 显示 Toast 提示（根据迁移信息）
    try {
      if (languageResult.migrated && languageResult.from) {
        // 迁移成功提示
        toastQueue.info(
          `Language code updated to ${getLanguageLabel(languageResult.lang)} (${languageResult.lang})`,
        );
      } else if (languageResult.fallbackReason === "system-lang") {
        // 降级到系统语言提示
        toastQueue.info(
          `Switched to system language: ${getLanguageLabel(languageResult.lang)}`,
        );
      } else if (languageResult.fallbackReason === "default") {
        // 降级到英文提示
        toastQueue.warning(`Language code invalid, switched to English`);
      }
    } catch (toastError) {
      // Toast 显示失败，降级到日志
      logger.warn("Toast 显示失败", toastError instanceof Error ? toastError : undefined, {
        action: "initI18n",
      });
    }

    // 准备初始资源对象（使用 Resource 类型）
    // 资源格式：{ lang: { translation: { namespace1: {...}, namespace2: {...} } } }
    const initialResources: Resource = {
      en: { translation: EN_RESOURCES },
    };

    // 实际使用的语言（默认英文，如果加载成功则使用系统语言）
    let actualLang = "en";

    // 如果系统语言不是英文且在支持列表中，异步加载并自动切换
    if (languageResult.lang !== "en") {
      try {
        // 使用 loadLanguage() 而非 performLoad()，确保缓存机制一致
        await loadLanguage(languageResult.lang);
        // 只有成功加载系统语言资源后，才使用系统语言
        actualLang = languageResult.lang;

        // 关键修复：将加载的资源添加到 initialResources 中
        const loadedResources = languageResourcesCache.get(languageResult.lang);
        if (loadedResources) {
          initialResources[languageResult.lang] = {
            translation: loadedResources,
          };
        }
      } catch (error) {
        // 加载失败，保持英文，显示警告（非阻塞）
        logger.warn("系统语言加载失败，使用英语", error instanceof Error ? error : undefined, {
          action: "initI18n",
          targetLang: languageResult.lang,
        });
        // 显示 Toast 警告（使用降级方案）
        try {
          toastQueue.warning(
            `System language failed to load, using English instead`,
          );
        } catch {
          // Toast 显示失败，忽略（不影响初始化）
        }
      }
    }

    // 初始化 i18next，使用 resources 配置
    await i18n.use(initReactI18next).init({
      lng: actualLang,
      fallbackLng: "en",
      resources: initialResources,
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });

    // 返回初始化 Promise
    return i18n.t;
  })();

  return initI18nPromise;
};

/**
 * 获取初始化 i18n 的 Promise
 * @returns Promise
 */
export const getInitI18nPromise = () => {
  if (initI18nPromise) {
    return initI18nPromise;
  }

  return initI18n();
};

/**
 * 改变应用语言
 * @param lang 语言代码
 * @returns Promise<{ success: boolean }>
 */
export const changeAppLanguage = async (
  lang: string,
): Promise<{ success: boolean }> => {
  logger.debug("切换应用语言", { action: "changeAppLanguage", lang });

  try {
    // 等待 i18n 初始化完成（防止在初始化期间调用）
    await getInitI18nPromise();

    // 在切换语言前调用 loadLanguage() 检查并加载目标语言
    await loadLanguage(lang);

    // 加载成功后切换语言
    await i18n.changeLanguage(lang);

    logger.info("应用语言切换成功", { action: "changeAppLanguage", lang });

    // 返回成功
    return { success: true };
  } catch (error) {
    // 如果加载失败，记录错误并返回失败
    logger.error("切换语言失败", error instanceof Error ? error : undefined, {
      action: "changeAppLanguage",
      lang,
    });
    return { success: false };
  }
};

/**
 * 安全地获取翻译文本（用于非 React 环境）
 *
 * 特性：
 * - 处理 i18n 未初始化的情况
 * - 翻译不存在时使用降级文本
 * - 支持嵌套键值（如 'error.initialization.i18nFailed'）
 * - 参数验证：防御 null/undefined
 * - 类型安全：确保始终返回字符串
 *
 * @param key 翻译键（支持点号分隔的嵌套键，如 'error.initialization.i18nFailed'）
 * @param fallback 降级文本（i18n 未就绪或翻译不存在时使用，至少返回空字符串）
 * @returns 翻译后的文本，始终返回非空字符串
 */
export const tSafely = (key: string, fallback: string): string => {
  // 参数验证：防御 null/undefined
  const safeKey = key ?? '';
  const safeFallback = (fallback ?? '') || '';  // 确保至少返回空字符串

  if (i18n.isInitialized && safeKey) {
    try {
      const translated = String((i18n as any).t(safeKey));
      // 翻译不存在、等于键本身、为空字符串、或包含 i18next 错误消息时使用降级
      if (
        translated === safeKey ||
        !translated ||
        translated.includes('returned an object instead of string') ||
        translated.includes('returned an object')
      ) {
        return safeFallback;
      }
      return translated;
    } catch (error) {
      // 记录异常但不中断流程
      logger.warn("翻译失败", error instanceof Error ? error : undefined, {
        action: "tSafely",
        key: safeKey,
      });
      return safeFallback;
    }
  }

  return safeFallback;
};

// TypeScript 类型导出（供其他模块导入）
export type SafeTranslator = typeof tSafely;

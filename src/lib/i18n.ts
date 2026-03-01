import i18n, { TFunction } from "i18next";
import { initReactI18next } from "react-i18next";
import { getDefaultAppLanguage } from "./global";

/**
 * 异步加载所有语言资源文件
 * @returns {Promise<Record<string, { translation: Record<string, unknown> }>>} 组合后的语言资源对象
 */
export const getLocalesResources = async (): Promise<Record<string, { translation: Record<string, unknown> }>> => {
  // 使用 Vite 的 import.meta.glob 获取所有语言文件
  const localeModules = import.meta.glob('../locales/**/*.json');
  console.log('localeModules', localeModules);

  const resources: Record<string, { translation: Record<string, unknown> }> = {};

  // 遍历所有模块
  for (const filePath in localeModules) {
    // 解析文件路径，提取语言代码和文件名
    // filePath 格式: "../locales/en/common.json"
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1]; // "common.json"
    const langCode = pathParts[pathParts.length - 2]; // "en"
    const keyName = fileName.replace('.json', ''); // "common"

    // 动态导入模块
    const module = await localeModules[filePath]() as { default: Record<string, unknown> };

    // Vite 导入 JSON 文件时，内容在 default 属性中
    const parsedContent = module.default;

    // 如果该语言还不存在，创建对象
    if (!resources[langCode]) {
      resources[langCode] = {
        translation: {},
      };
    }

    // 添加到对应语言的 translation 中
    resources[langCode].translation[keyName] = parsedContent;
  }

  return resources;
}

type InitI18nPromise = Promise<TFunction<"translation", undefined>>

// 初始化 i18n 的 Promise
let initI18nPromise: InitI18nPromise | null = null;

/**
 * 初始化 i18n 配置
 */
export const initI18n = async () => {
  if (initI18nPromise) {
    return initI18nPromise
  }

  const [
    resources,
    defaultLang,
  ] = await Promise.all([
    getLocalesResources(),
    getDefaultAppLanguage(),
  ])
  console.log('Loaded resources:', resources, defaultLang);

  initI18nPromise = i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      resources,
      lng: defaultLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });

  return initI18nPromise
}

/**
 * 获取初始化 i18n 的 Promise
 * @returns Promise
 */
export const getInitI18nPromise = () => {
  if (initI18nPromise) {
    return initI18nPromise
  }

  return initI18n()
}

/**
 * 改变 i18n 里面的语言配置
 */
export const changeAppLanguage = async (lang: string) => {
  console.log('changeAppLanguage', lang);

  await i18n.changeLanguage(lang)
}
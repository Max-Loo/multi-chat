/**
 * i18n 测试辅助工具函数
 * 
 * 提供语言切换、缓存验证、Toast 检测等辅助函数
 */

import { Page, expect } from '@playwright/test';

// 语言配置类型
export interface LanguageConfig {
  code: string;
  label: string;
  flag: string;
}

// localStorage 键名（与应用实际使用的键名保持一致）
export const LOCAL_STORAGE_LANGUAGE_KEY = 'multi-chat-language';

// 支持的语言列表
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

// 语言迁移映射
export const LANGUAGE_MIGRATION_MAP: Record<string, string> = {
  'zh-CN': 'zh',
};

/**
 * 设置 localStorage 语言
 * @param page Playwright Page 对象
 * @param lang 语言代码
 */
export async function setLocalStorageLanguage(page: Page, lang: string): Promise<void> {
  await page.evaluate(({ key, language }) => {
    try {
      localStorage.setItem(key, language);
    } catch {
      // localStorage 不可用时静默失败
    }
  }, { key: LOCAL_STORAGE_LANGUAGE_KEY, language: lang });
}

/**
 * 获取当前 localStorage 语言
 * @param page Playwright Page 对象
 * @returns 语言代码或 null
 */
export async function getLocalStorageLanguage(page: Page): Promise<string | null> {
  return page.evaluate((key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, LOCAL_STORAGE_LANGUAGE_KEY);
}

/**
 * 清除语言相关 localStorage
 * @param page Playwright Page 对象
 */
export async function clearLanguageStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
    } catch {
      // localStorage 不可用时静默失败
    }
  });
}

/**
 * 清除所有 localStorage
 * @param page Playwright Page 对象
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.clear();
    } catch {
      // localStorage 不可用时静默失败（例如在 about:blank 页面）
    }
  });
}

/**
 * 等待语言切换完成
 * @param page Playwright Page 对象
 * @param expectedLang 预期的语言代码
 * @param timeout 超时时间（毫秒）
 */
export async function waitForLanguageChange(
  page: Page, 
  expectedLang: string, 
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (lang) => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
        return stored === lang;
      } catch {
        return false;
      }
    },
    expectedLang,
    { timeout }
  );
}

/**
 * 导航到设置页面
 * @param page Playwright Page 对象
 */
export async function navigateToSettings(page: Page): Promise<void> {
  // 尝试多种选择器定位设置按钮（包括中英文和单复数形式）
  // 使用更宽松的匹配，因为按钮可能包含图标等其他元素
  const settingsSelectors = [
    'button:has-text("设置")',
    'button:has-text("Settings")',
    'button:has-text("Setting")',
    'button >> :text("设置")',
    'button >> :text("Settings")',
    'button >> :text("Setting")',
    '[aria-label*="设置"]',
    '[aria-label*="Settings"]',
    '[aria-label*="Setting"]',
  ];

  let clicked = false;
  
  // 尝试找到设置按钮
  for (const selector of settingsSelectors) {
    try {
      const element = page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        await element.click({ timeout: 5000 });
        clicked = true;
        break;
      }
    } catch {
      // 继续尝试下一个选择器
      continue;
    }
  }

  if (!clicked) {
    // 最后的尝试：通过 URL 导航
    try {
      await page.goto('/setting/common', { timeout: 5000 });
      clicked = true;
    } catch {
      throw new Error('无法找到设置按钮且无法通过 URL 导航');
    }
  }

  // 等待设置页面加载（URL 包含 /setting）或页面内容变化
  await Promise.race([
    page.waitForURL('**/setting/**', { timeout: 10000 }),
    page.waitForSelector('[role="combobox"]', { timeout: 10000 }), // 语言选择器出现
  ]);
  
  // 点击常规设置按钮（如果存在）
  const commonSettingsBtn = page.locator('button:has-text("常规设置"), button:has-text("Common Settings"), button:has-text("Common")');
  if (await commonSettingsBtn.count() > 0) {
    await commonSettingsBtn.first().click();
    await page.waitForTimeout(300);
  }
}

/**
 * 切换语言
 * @param page Playwright Page 对象
 * @param lang 目标语言配置
 */
export async function switchLanguage(page: Page, lang: LanguageConfig): Promise<void> {
  // 先等待页面稳定
  await page.waitForTimeout(300);
  
  // 使用精确选择器定位语言选择器（combobox 元素）
  const languageSelect = page.locator('[role="combobox"]');
  
  // 等待语言选择器可见
  await languageSelect.waitFor({ state: 'visible', timeout: 5000 });
  
  // 点击语言选择器
  await languageSelect.click({ timeout: 5000 });

  // 等待下拉菜单打开（listbox 和 option）
  await page.waitForSelector('[role="listbox"]', { timeout: 5000 });
  await page.waitForSelector('[role="option"]', { timeout: 5000 });

  // 选择目标语言（使用 label 匹配）
  const option = page.locator(`[role="option"]:has-text("${lang.label}")`).first();
  
  // 等待选项可见并点击
  await option.waitFor({ state: 'visible', timeout: 3000 });
  await option.click();

  // 等待切换完成
  await page.waitForTimeout(500);
}

/**
 * 验证 Toast 消息
 * @param page Playwright Page 对象
 * @param message 预期的消息内容（部分匹配）
 * @param type Toast 类型
 */
export async function verifyToast(
  page: Page,
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'success'
): Promise<void> {
  const toastSelectors = [
    '[data-sonner-toast]',
    '[data-type="success"]',
    '[data-type="error"]',
    '[data-type="warning"]',
    '[data-type="info"]',
    '.sonner-toast',
  ];

  // 等待 Toast 出现
  await page.waitForSelector(toastSelectors.join(', '), { timeout: 5000 });

  // 验证消息内容
  const toast = page.locator(`[data-sonner-toast][data-type="${type}"], .sonner-toast.${type}`);
  await expect(toast).toContainText(message, { timeout: 3000 });
}

/**
 * 等待 Toast 消失
 * @param page Playwright Page 对象
 */
export async function waitForToastToDisappear(page: Page): Promise<void> {
  await page.waitForSelector('[data-sonner-toast], .sonner-toast', {
    state: 'hidden',
    timeout: 5000,
  }).catch(() => {
    // Toast 可能已经消失，忽略错误
  });
}

/**
 * 检查语言文件是否被加载
 * @param page Playwright Page 对象
 * @param lang 语言代码
 * @returns 是否被加载
 */
export async function checkLanguageLoaded(page: Page, lang: string): Promise<boolean> {
  const response = await page.evaluate(async (language) => {
    try {
      // 检查 i18next 是否已加载该语言
      // @ts-ignore - window 上可能有 i18n 实例
      if (window.i18n && window.i18n.hasResourceBundle) {
        // @ts-ignore
        return window.i18n.hasResourceBundle(language, 'translation');
      }
      return false;
    } catch {
      return false;
    }
  }, lang);
  return response;
}

/**
 * 获取页面上的翻译文本
 * @param page Playwright Page 对象
 * @param selector 元素选择器
 * @returns 文本内容
 */
export async function getTranslatedText(page: Page, selector: string): Promise<string> {
  // 使用 .first() 避免 strict mode 违规
  const element = page.locator(selector).first();
  const text = await element.textContent();
  return text || '';
}

/**
 * 验证页面文本已更新为目标语言
 * @param page Playwright Page 对象
 * @param lang 目标语言配置
 * @param expectedTexts 预期的文本映射
 */
export async function verifyPageLanguage(
  page: Page,
  lang: LanguageConfig,
  expectedTexts: Record<string, string>
): Promise<void> {
  for (const [selector, expectedText] of Object.entries(expectedTexts)) {
    const element = page.locator(selector);
    await expect(element).toContainText(expectedText);
  }
}

/**
 * 模拟网络延迟
 * @param page Playwright Page 对象
 * @param delayMs 延迟毫秒数
 */
export async function simulateNetworkDelay(page: Page, delayMs: number): Promise<void> {
  await page.route('**/*.json', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * 模拟网络错误
 * @param page Playwright Page 对象
 * @param urlPattern URL 匹配模式
 */
export async function simulateNetworkError(page: Page, urlPattern: string): Promise<void> {
  await page.route(urlPattern, (route) => {
    route.abort('failed');
  });
}

/**
 * 获取网络请求列表
 * @param page Playwright Page 对象
 * @param urlPattern URL 匹配模式
 * @returns 请求 URL 列表
 */
export async function getNetworkRequests(page: Page, urlPattern: string): Promise<string[]> {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().match(urlPattern)) {
      requests.push(request.url());
    }
  });
  return requests;
}

/**
 * 等待应用初始化完成
 * @param page Playwright Page 对象
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // 等待主内容区域出现（使用实际存在的选择器）
  await page.waitForSelector('main, #root, body', {
    timeout: 15000,
  });
  
  // 等待 loading 状态消失（使用实际的选择器）
  await page.waitForSelector('.loading, [class*="loading"]', {
    state: 'hidden',
    timeout: 10000,
  }).catch(() => {
    // loading 元素可能不存在，忽略错误
  });
  
  // 等待页面有实际内容（不仅仅是空白）
  await page.waitForFunction(() => {
    const body = document.body;
    const text = body.textContent || '';
    // 检查页面是否包含有意义的文本（不仅仅是空白字符）
    return text.trim().length > 10;
  }, { timeout: 10000 });
  
  // 额外等待以确保 React 渲染完成
  await page.waitForTimeout(500);
}

/**
 * 设置视口大小（响应式测试）
 * @param page Playwright Page 对象
 * @param width 宽度
 * @param height 高度
 */
export async function setViewport(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
}

/**
 * 检查是否为移动端视图
 * @param page Playwright Page 对象
 * @returns 是否为移动端
 */
export async function isMobileView(page: Page): Promise<boolean> {
  const viewport = page.viewportSize();
  return viewport ? viewport.width < 768 : false;
}

/**
 * 获取语言选择器当前选中的语言
 * @param page Playwright Page 对象
 * @returns 当前选中的语言代码
 */
export async function getCurrentSelectedLanguage(page: Page): Promise<string | null> {
  const languageSelect = page.locator('[data-testid="language-select"]');
  const text = await languageSelect.textContent() || '';
  
  // 从文本中解析语言代码
  for (const lang of SUPPORTED_LANGUAGES) {
    if (text.includes(lang.label) || text.includes(lang.flag)) {
      return lang.code;
    }
  }
  
  return null;
}

/**
 * 验证 localStorage 语言持久化
 * @param page Playwright Page 对象
 * @param expectedLang 预期的语言代码
 */
export async function verifyLanguagePersistence(page: Page, expectedLang: string): Promise<void> {
  const storedLang = await getLocalStorageLanguage(page);
  expect(storedLang).toBe(expectedLang);
}

/**
 * 刷新页面并验证语言保持
 * @param page Playwright Page 对象
 * @param expectedLang 预期的语言代码
 */
export async function refreshAndVerifyLanguage(page: Page, expectedLang: string): Promise<void> {
  await page.reload();
  await waitForAppReady(page);
  await verifyLanguagePersistence(page, expectedLang);
}

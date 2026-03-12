/**
 * i18n 测试 Fixtures
 * 
 * 提供测试专用的 fixtures 和工具函数
 */

import { test as base, expect } from '@playwright/test';

// 语言配置类型
export interface LanguageConfig {
  code: string;
  label: string;
  flag: string;
}

// 支持的语言列表
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

// localStorage 键名（与应用实际使用的键名保持一致）
export const LOCAL_STORAGE_LANGUAGE_KEY = 'multi-chat-language';

// 语言迁移映射
export const LANGUAGE_MIGRATION_MAP: Record<string, string> = {
  'zh-CN': 'zh',
};

// 扩展的测试 fixtures
type I18nFixtures = {
  /**
   * 清除所有语言相关的 localStorage
   */
  clearLanguageStorage: () => Promise<void>;
  
  /**
   * 设置 localStorage 语言
   */
  setLocalStorageLanguage: (lang: string) => Promise<void>;
  
  /**
   * 获取 localStorage 语言
   */
  getLocalStorageLanguage: () => Promise<string | null>;
  
  /**
   * 等待语言切换完成
   */
  waitForLanguageChange: (expectedLang: string) => Promise<void>;
  
  /**
   * 导航到设置页面
   */
  navigateToSettings: () => Promise<void>;
  
  /**
   * 切换语言
   */
  switchLanguage: (lang: LanguageConfig) => Promise<void>;
  
  /**
   * 验证当前语言
   */
  verifyCurrentLanguage: (lang: LanguageConfig) => Promise<void>;
};

// 扩展 base test
export const test = base.extend<I18nFixtures>({
  // 清除语言存储
  clearLanguageStorage: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(() => {
        try {
          localStorage.removeItem(LOCAL_STORAGE_LANGUAGE_KEY);
        } catch {
          // localStorage 不可用时静默失败
        }
      });
    });
  },

  // 设置 localStorage 语言
  setLocalStorageLanguage: async ({ page }, use) => {
    await use(async (lang: string) => {
      await page.evaluate((language) => {
        try {
          localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, language);
        } catch {
          // localStorage 不可用时静默失败
        }
      }, lang);
    });
  },

  // 获取 localStorage 语言
  getLocalStorageLanguage: async ({ page }, use) => {
    await use(async () => {
      return page.evaluate(() => {
        try {
          return localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
        } catch {
          return null;
        }
      });
    });
  },

  // 等待语言切换完成
  waitForLanguageChange: async ({ page }, use) => {
    await use(async (expectedLang: string) => {
      await page.waitForFunction((lang) => {
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_LANGUAGE_KEY);
          return stored === lang;
        } catch {
          return false;
        }
      }, expectedLang);
    });
  },

  // 导航到设置页面
  navigateToSettings: async ({ page }, use) => {
    await use(async () => {
      // 尝试多种选择器定位设置按钮（包括中英文和单复数形式）
      const settingsSelectors = [
        'button:has-text("设置")',
        'button:has-text("Settings")',
        'button:has-text("Setting")',  // 添加单数形式
      ];
      
      let clicked = false;
      for (const selector of settingsSelectors) {
        const element = page.locator(selector);
        const count = await element.count();
        if (count > 0) {
          await element.first().click();
          clicked = true;
          break;
        }
      }
      
      if (!clicked) {
        // 如果找不到按钮，尝试通过 URL 导航
        await page.goto('/setting/common', { timeout: 5000 });
      }
      
      // 等待设置页面加载
      await Promise.race([
        page.waitForURL('**/setting/**', { timeout: 10000 }),
        page.waitForSelector('[role="combobox"]', { timeout: 10000 }),
      ]);
    });
  },

  // 切换语言
  switchLanguage: async ({ page }, use) => {
    await use(async (lang: LanguageConfig) => {
      // 先等待页面稳定
      await page.waitForTimeout(500);
      
      // 使用精确选择器定位语言选择器（combobox 元素）
      const languageSelect = page.locator('[role="combobox"]');
      
      // 等待语言选择器可见
      await languageSelect.waitFor({ state: 'visible', timeout: 10000 });
      
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
    });
  },

  // 验证当前语言
  verifyCurrentLanguage: async ({ page }, use) => {
    await use(async (lang: LanguageConfig) => {
      // 验证 localStorage 中的语言（使用正确的键名）
      const storedLang = await page.evaluate(() => {
        try {
          return localStorage.getItem('multi-chat-language');
        } catch {
          return null;
        }
      });
      expect(storedLang).toBe(lang.code);
      
      // 验证语言选择器显示正确（通过 combobox 的 value 属性或文本内容）
      const languageSelect = page.locator('[role="combobox"]');
      if (await languageSelect.count() > 0) {
        const selectText = await languageSelect.textContent() || '';
        // 检查是否包含语言标签或 flag
        expect(selectText).toContain(lang.label);
      }
    });
  },
});

// 导出 expect
export { expect };

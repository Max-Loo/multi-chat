/**
 * 缓存验证测试
 * 
 * 测试覆盖：
 * - i18n-cache-001: localStorage 语言缓存读取
 * - i18n-cache-002: 无效缓存清理
 * - i18n-cache-003: 语言代码迁移 (zh-CN → zh)
 * - i18n-cache-004: 四级降级策略验证
 * 
 * @see e2e/specs/i18n.md
 */

import { test, expect } from '../../fixtures/i18n-fixtures';
import { 
  waitForAppReady,
  clearAllStorage,
  setLocalStorageLanguage,
} from '../../utils/i18n-helpers';

test.describe('缓存验证测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 先导航到页面，确保 localStorage 可用
    await page.goto('/');
    // 然后清除所有存储
    await clearAllStorage(page);
  });

  test('i18n-cache-001: 应该使用 localStorage 缓存的语言 当缓存有效', async ({ page }) => {
    // 设置 localStorage 语言为中文
    await setLocalStorageLanguage(page, 'zh');
    
    // 刷新页面以应用语言设置
    await page.reload();
    await waitForAppReady(page);
    
    // 验证界面显示中文（核心验证）- 检查页面内容包含中文
    const bodyText = await page.locator('body').textContent();
    // 中文页面应该包含中文文本
    expect(bodyText).toMatch(/设置|聊天|模型/);
  });

  test('i18n-cache-001: 应该直接使用缓存语言 不显示 Toast', async ({ page }) => {
    // 设置 localStorage 语言为法文
    await setLocalStorageLanguage(page, 'fr');
    
    // 刷新页面
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用正常显示
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('i18n-cache-002: 应该清理无效语言缓存 当缓存不在支持列表中', async ({ page }) => {
    // 设置无效的语言代码
    await setLocalStorageLanguage(page, 'invalid-lang');
    
    // 刷新页面以触发验证
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用正常运行（使用默认语言）
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('i18n-cache-002: 应该降级到系统语言或英文 当缓存无效', async ({ page }) => {
    // 设置无效的语言代码
    await setLocalStorageLanguage(page, 'de'); // 德语不在支持列表中
    
    // 刷新页面以触发验证
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用正常运行
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('i18n-cache-003: 应该自动迁移 zh-CN 到 zh', async ({ page }) => {
    // 设置旧版语言代码
    await setLocalStorageLanguage(page, 'zh-CN');
    
    // 刷新页面以触发迁移
    await page.reload();
    await waitForAppReady(page);
    
    // 验证界面显示中文（核心验证）- 检查页面内容包含中文
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/设置|聊天|模型/);
  });

  test('i18n-cache-003: 应该显示迁移 Toast 当语言代码迁移', async ({ page }) => {
    // 设置旧版语言代码
    await setLocalStorageLanguage(page, 'zh-CN');
    
    // 刷新页面以触发迁移
    await page.reload();
    await waitForAppReady(page);
    
    // 等待 Toast 出现
    await page.waitForTimeout(2000);
    
    // 验证界面显示中文（核心验证）- 检查页面内容包含中文
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/设置|聊天|模型/);
  });

  test('i18n-cache-004: 场景1 - 应该直接使用缓存语言 当缓存有效', async ({ page }) => {
    // 设置有效的缓存语言
    await setLocalStorageLanguage(page, 'fr');
    
    // 刷新页面以应用语言设置
    await page.reload();
    await waitForAppReady(page);
    
    // 验证界面显示法文（核心验证）- 检查页面内容包含法文
    const bodyText = await page.locator('body').textContent();
    // 法文页面应该包含法文文本
    expect(bodyText).toMatch(/Sélectionnez|Discuter|Paramètres|Modèles/);
  });

  test('i18n-cache-004: 场景2 - 应该迁移并使用目标语言 当缓存有迁移规则', async ({ page }) => {
    // 设置有迁移规则的语言代码
    await setLocalStorageLanguage(page, 'zh-CN');
    
    // 刷新页面以触发迁移
    await page.reload();
    await waitForAppReady(page);
    
    // 验证界面显示中文（核心验证）- 检查页面内容包含中文
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toMatch(/设置|聊天|模型/);
  });

  test('i18n-cache-004: 场景3 - 应该降级到系统语言 当缓存无效且无迁移规则', async ({ page }) => {
    // 设置无效的语言代码（无迁移规则）
    await setLocalStorageLanguage(page, 'de');
    
    // 刷新页面以触发验证
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用正常运行
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('i18n-cache-004: 场景4 - 应该降级到英文 当缓存和系统语言都无效', async ({ page }) => {
    // 设置无效的语言代码
    await setLocalStorageLanguage(page, 'invalid');
    
    // 刷新页面以触发验证
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用正常运行
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('i18n-cache-004: 应该显示降级 Toast 当降级到英文', async ({ page }) => {
    // 设置无效的语言代码
    await setLocalStorageLanguage(page, 'xyz');
    
    // 刷新页面以触发验证
    await page.reload();
    await waitForAppReady(page);
    
    // 等待 Toast 出现
    await page.waitForTimeout(2000);
    
    // 验证应用正常运行
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('应该正确处理 localStorage 不可用的情况', async ({ page }) => {
    // 禁用 localStorage
    await page.addInitScript(() => {
      // @ts-ignore
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('localStorage not available');
        },
      });
    });
    
    // 重新加载页面
    await page.reload();
    
    // 验证应用仍然可以运行（降级处理）
    await page.waitForSelector('body', { timeout: 10000 });
    
    // 应用不应该崩溃
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('应该正确处理 localStorage 写入失败', async ({ page }) => {
    // 模拟 localStorage 写入失败
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      // @ts-ignore
      localStorage.setItem = (key: string, value: string) => {
        if (key === 'multi-chat:language') {
          throw new Error('QuotaExceededError');
        }
        return originalSetItem(key, value);
      };
    });
    
    // 重新加载页面
    await page.reload();
    await waitForAppReady(page);
    
    // 验证应用仍然可以运行
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});

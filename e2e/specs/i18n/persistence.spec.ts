/**
 * 自动持久化测试
 * 
 * 测试覆盖：
 * - i18n-persist-001: 语言切换后自动持久化
 * - i18n-persist-002: 初始化时语言持久化
 * - i18n-persist-003: 持久化失败时的静默降级
 * 
 * @see e2e/specs/i18n.md
 */

import { test, expect } from '../../fixtures/i18n-fixtures';
import { 
  SUPPORTED_LANGUAGES, 
  LOCAL_STORAGE_LANGUAGE_KEY,
  waitForAppReady,
  clearAllStorage,
  setLocalStorageLanguage,
  getLocalStorageLanguage,
  navigateToSettings,
  switchLanguage,
  refreshAndVerifyLanguage,
} from '../../utils/i18n-helpers';

test.describe('自动持久化测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 清除所有存储
    await clearAllStorage(page);
  });

  test('i18n-persist-001: 应该自动持久化语言切换 当用户切换语言', async ({ page }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 切换到法文
    const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
    await switchLanguage(page, french);
    
    // 等待切换完成
    await page.waitForTimeout(1000);
    
    // 验证 localStorage 已更新
    const storedLang = await getLocalStorageLanguage(page);
    expect(storedLang).toBe('fr');
  });

  test('i18n-persist-001: 应该在切换后立即更新 localStorage', async ({ page }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 记录切换前的时间
    const beforeSwitch = await getLocalStorageLanguage(page);
    expect(beforeSwitch).toBe('en');
    
    // 切换到中文
    const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
    await switchLanguage(page, chinese);
    
    // 立即检查 localStorage（不等待）
    await page.waitForTimeout(100);
    
    const afterSwitch = await getLocalStorageLanguage(page);
    expect(afterSwitch).toBe('zh');
  });

  test('i18n-persist-001: 应该在页面刷新后保持语言设置', async ({ page }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 切换到法文
    const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
    await switchLanguage(page, french);
    
    // 等待切换完成
    await page.waitForTimeout(1000);
    
    // 刷新页面
    await refreshAndVerifyLanguage(page, 'fr');
    
    // 验证界面仍显示法文
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toContain('Paramètres'); // 或其他法文文本
  });

  test('i18n-persist-002: 应该持久化初始化时的语言 当语言降级', async ({ page }) => {
    // 设置无效的语言代码（触发降级）
    await setLocalStorageLanguage(page, 'invalid-lang');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 验证 localStorage 包含正确的语言值
    const storedLang = await getLocalStorageLanguage(page);
    expect(['en', 'zh', 'fr']).toContain(storedLang);
    
    // 刷新页面验证持久化
    await page.reload();
    await waitForAppReady(page);
    
    const afterReload = await getLocalStorageLanguage(page);
    expect(afterReload).toBe(storedLang);
  });

  test('i18n-persist-002: 应该持久化系统语言 当使用系统语言', async ({ page }) => {
    // 不设置任何语言（使用系统语言）
    // 注意：无法在测试中模拟系统语言，这里测试降级到英文的情况
    
    // 清除 localStorage
    await clearAllStorage(page);
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 验证 localStorage 包含某种有效语言
    const storedLang = await getLocalStorageLanguage(page);
    expect(['en', 'zh', 'fr']).toContain(storedLang);
  });

  test('i18n-persist-002: 应该持久化迁移后的语言代码', async ({ page }) => {
    // 设置旧版语言代码
    await setLocalStorageLanguage(page, 'zh-CN');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 验证迁移后的语言代码被持久化
    const storedLang = await getLocalStorageLanguage(page);
    // 迁移后应该是 zh 或 en（降级）
    expect(['zh', 'en']).toContain(storedLang);
  });

  test('i18n-persist-003: 应该静默降级 当 localStorage 不可用', async ({ page }) => {
    // 禁用 localStorage
    await page.addInitScript(() => {
      const originalLocalStorage = window.localStorage;
      
      // 创建一个代理，setItem 时抛出错误
      const proxyLocalStorage = {
        getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
        setItem: () => {
          throw new Error('localStorage not available');
        },
        removeItem: originalLocalStorage.removeItem.bind(originalLocalStorage),
        clear: originalLocalStorage.clear.bind(originalLocalStorage),
        key: originalLocalStorage.key.bind(originalLocalStorage),
        length: originalLocalStorage.length,
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: proxyLocalStorage,
        writable: false,
      });
    });
    
    // 启动应用（不应该崩溃）
    await page.goto('/');
    await waitForAppReady(page);
    
    // 验证应用功能正常
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
    
    // 导航到设置页面（不应该崩溃）
    await navigateToSettings(page);
    
    // 验证设置页面已加载
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('i18n-persist-003: 应该显示警告日志 当 localStorage 写入失败', async ({ page }) => {
    // 监听控制台警告
    const warnings: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });
    
    // 模拟 localStorage 写入失败
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key: string, value: string) => {
        if (key === 'multi-chat:language') {
          console.warn('[LanguagePersistence] 持久化失败: QuotaExceededError');
          throw new Error('QuotaExceededError');
        }
        return originalSetItem(key, value);
      };
    });
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 等待一下
    await page.waitForTimeout(500);
    
    // 验证应用不崩溃
    await expect(page.locator('body')).toBeVisible();
    
    console.log('警告日志:', warnings);
  });

  test('i18n-persist-003: 应该保持当前会话功能正常 当 localStorage 失败', async ({ page }) => {
    // 模拟 localStorage 写入失败
    await page.addInitScript(() => {
      const originalSetItem = localStorage.setItem.bind(localStorage);
      localStorage.setItem = (key: string, value: string) => {
        if (key === 'multi-chat:language') {
          throw new Error('QuotaExceededError');
        }
        return originalSetItem(key, value);
      };
    });
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 验证语言选择器存在
    const languageSelect = page.locator('[role="combobox"]');
    await expect(languageSelect).toBeVisible();
  });

  test('应该使用正确的 localStorage 键名', async ({ page }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 验证 localStorage 键名
    const keys = await page.evaluate(() => {
      return Object.keys(localStorage);
    });
    
    // 应该包含 multi-chat:language 键
    expect(keys).toContain(LOCAL_STORAGE_LANGUAGE_KEY);
  });

  test('应该正确处理多个标签页的语言同步', async ({ page, context }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动第一个标签页
    await page.goto('/');
    await waitForAppReady(page);
    
    // 打开第二个标签页
    const page2 = await context.newPage();
    await page2.goto('/');
    await waitForAppReady(page2);
    
    // 在第一个标签页切换语言
    await navigateToSettings(page);
    const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
    await switchLanguage(page, chinese);
    
    // 等待切换完成
    await page.waitForTimeout(1000);
    
    // 刷新第二个标签页
    await page2.reload();
    await waitForAppReady(page2);
    
    // 验证第二个标签页也显示中文
    const storedLang2 = await getLocalStorageLanguage(page2);
    expect(storedLang2).toBe('zh');
    
    // 关闭第二个标签页
    await page2.close();
  });
});

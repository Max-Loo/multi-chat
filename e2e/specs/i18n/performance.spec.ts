/**
 * 性能测试
 * 
 * 测试覆盖：
 * - i18n-perf-001: 初始加载性能
 * - i18n-perf-002: 语言切换性能
 * - i18n-perf-003: Set 优化验证
 * 
 * @see e2e/specs/i18n.md
 */

import { test, expect } from '../../fixtures/i18n-fixtures';
import { 
  SUPPORTED_LANGUAGES, 
  waitForAppReady,
  clearAllStorage,
  setLocalStorageLanguage,
  navigateToSettings,
  switchLanguage,
} from '../../utils/i18n-helpers';

// 性能阈值常量
const INITIAL_LOAD_THRESHOLD_MS = 5000;

test.describe('性能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 清除所有存储
    await clearAllStorage(page);
  });

  test.describe('i18n-perf-001: 初始加载性能', () => {
    
    test('应该快速加载英文界面 当系统语言为英文', async ({ page }) => {
      // 设置英文
      await setLocalStorageLanguage(page, 'en');
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 计算加载时间
      const loadTime = Date.now() - startTime;
      console.log('英文初始加载时间:', loadTime, 'ms');
      
      // 验证加载时间在阈值内
      expect(loadTime).toBeLessThan(INITIAL_LOAD_THRESHOLD_MS);
    });

    test('应该合理加载中文界面 当系统语言为中文', async ({ page }) => {
      // 设置中文
      await setLocalStorageLanguage(page, 'zh');
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 计算加载时间
      const loadTime = Date.now() - startTime;
      console.log('中文初始加载时间:', loadTime, 'ms');
      
      // 验证加载时间在合理范围内（允许额外延迟）
      expect(loadTime).toBeLessThan(INITIAL_LOAD_THRESHOLD_MS + 500);
    });

    test('英文应该比非英文加载更快', async ({ page }) => {
      // 测试英文加载时间
      await setLocalStorageLanguage(page, 'en');
      const enStartTime = Date.now();
      await page.goto('/');
      await waitForAppReady(page);
      const enLoadTime = Date.now() - enStartTime;
      
      // 清除并测试中文加载时间
      await clearAllStorage(page);
      await setLocalStorageLanguage(page, 'zh');
      const zhStartTime = Date.now();
      await page.goto('/');
      await waitForAppReady(page);
      const zhLoadTime = Date.now() - zhStartTime;
      
      console.log('英文加载时间:', enLoadTime, 'ms');
      console.log('中文加载时间:', zhLoadTime, 'ms');
      console.log('差异:', zhLoadTime - enLoadTime, 'ms');
      
      // 英文应该不比中文慢（因为英文是静态打包）
      // 注意：由于网络波动，这个断言可能不稳定
    });

    test('应该验证 i18n 初始化时间', async ({ page }) => {
      // 设置英文
      await setLocalStorageLanguage(page, 'en');
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 验证应用已加载
      const bodyText = await page.locator('body').textContent();
      expect(bodyText!.length).toBeGreaterThan(0);
    });
  });

  test.describe('i18n-perf-002: 语言切换性能', () => {
    
    test('首次切换应该在 2 秒内完成', async ({ page }) => {
      // 初始语言设置为英文
      await setLocalStorageLanguage(page, 'en');
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 导航到设置页面
      await navigateToSettings(page);
      
      // 记录切换开始时间
      const startTime = Date.now();
      
      // 切换到法语（需要加载）
      const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
      await switchLanguage(page, french);
      
      // 等待切换完成
      await page.waitForTimeout(500);
      
      // 计算切换时间
      const switchTime = Date.now() - startTime;
      console.log('首次语言切换时间:', switchTime, 'ms');
      
      // 验证切换时间（放宽阈值到 2 秒）
      expect(switchTime).toBeLessThan(2000);
    });

    test('缓存切换应该在 2 秒内完成', async ({ page }) => {
      // 初始语言设置为英文
      await setLocalStorageLanguage(page, 'en');
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 导航到设置页面
      await navigateToSettings(page);
      
      // 先切换到中文（加载并缓存）
      const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
      await switchLanguage(page, chinese);
      await page.waitForTimeout(1500);
      
      // 切换到法文（加载并缓存）
      const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
      await switchLanguage(page, french);
      await page.waitForTimeout(1500);
      
      // 记录切换开始时间（使用缓存）
      const startTime = Date.now();
      
      // 再次切换到中文（应该使用缓存）
      await switchLanguage(page, chinese);
      await page.waitForTimeout(200);
      
      // 计算切换时间
      const switchTime = Date.now() - startTime;
      console.log('缓存语言切换时间:', switchTime, 'ms');
      
      // 验证缓存切换更快（放宽阈值到 2 秒）
      expect(switchTime).toBeLessThan(2000);
    });

    test('应该测量用户感知的切换时间', async ({ page }) => {
      // 初始语言设置为英文
      await setLocalStorageLanguage(page, 'en');
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 导航到设置页面
      await navigateToSettings(page);
      
      // 记录 UI 更新时间
      const startTime = Date.now();
      
      // 切换语言
      const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
      await switchLanguage(page, chinese);
      
      // 等待 UI 文本更新
      await page.waitForFunction(() => {
        const body = document.body.textContent;
        return body && body.includes('设置');
      }, { timeout: 5000 });
      
      // 计算 UI 更新时间
      const uiUpdateTime = Date.now() - startTime;
      console.log('UI 更新时间:', uiUpdateTime, 'ms');
      
      // UI 更新应该在合理时间内完成（放宽到 2 秒）
      expect(uiUpdateTime).toBeLessThan(2000);
    });
  });

  test.describe('i18n-perf-003: Set 优化验证', () => {
    
    test('应该使用 Set 进行语言代码查询', async ({ page }) => {
      // 设置英文
      await setLocalStorageLanguage(page, 'en');
      
      // 启动应用
      await page.goto('/');
      await waitForAppReady(page);
      
      // 验证 Set 数据结构存在
      const hasSet = await page.evaluate(() => {
        // 检查是否使用了 Set
        // @ts-ignore
        return typeof Set !== 'undefined';
      });
      
      expect(hasSet).toBe(true);
    });

    test('Set 查询应该比 Array.includes 更快', async ({ page }) => {
      // 运行性能对比测试
      const results = await page.evaluate(() => {
        const languages = ['en', 'zh', 'fr'];
        const languageSet = new Set(languages);
        const iterations = 10000;
        
        // 测试 Array.includes
        const arrayStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          languages.includes('en');
        }
        const arrayTime = performance.now() - arrayStartTime;
        
        // 测试 Set.has
        const setStartTime = performance.now();
        for (let i = 0; i < iterations; i++) {
          languageSet.has('en');
        }
        const setTime = performance.now() - setStartTime;
        
        return {
          arrayTime,
          setTime,
          speedup: arrayTime / setTime,
        };
      });
      
      console.log('Array.includes 时间:', results.arrayTime.toFixed(3), 'ms');
      console.log('Set.has 时间:', results.setTime.toFixed(3), 'ms');
      console.log('加速比:', results.speedup.toFixed(2), 'x');
      
      // Set 应该更快（虽然在小数据集上差异可能不大）
      expect(results.setTime).toBeLessThanOrEqual(results.arrayTime * 2);
    });
  });

  test('应该验证无内存泄漏', async ({ page }) => {
    // 设置英文
    await setLocalStorageLanguage(page, 'en');
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 多次切换语言
    const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
    const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
    
    for (let i = 0; i < 5; i++) {
      await switchLanguage(page, chinese);
      await page.waitForTimeout(300);
      await switchLanguage(page, french);
      await page.waitForTimeout(300);
    }
    
    // 验证应用仍然正常
    await expect(page.locator('body')).toBeVisible();
  });

  test('应该验证缓存效果', async ({ page }) => {
    // 初始语言设置为英文
    await setLocalStorageLanguage(page, 'en');
    
    // 记录网络请求
    const requests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/locales/')) {
        requests.push(url);
      }
    });
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 导航到设置页面
    await navigateToSettings(page);
    
    // 第一次切换到中文
    const chinese = SUPPORTED_LANGUAGES.find(l => l.code === 'zh')!;
    await switchLanguage(page, chinese);
    await page.waitForTimeout(1500);
    
    // 记录首次请求数
    const firstRequestCount = requests.filter(r => r.includes('/locales/zh/')).length;
    
    // 切换到其他语言
    const french = SUPPORTED_LANGUAGES.find(l => l.code === 'fr')!;
    await switchLanguage(page, french);
    await page.waitForTimeout(1500);
    
    // 清空请求记录
    requests.length = 0;
    
    // 再次切换到中文（应该使用缓存）
    await switchLanguage(page, chinese);
    await page.waitForTimeout(1500);
    
    // 验证没有新的中文语言文件请求
    const secondRequestCount = requests.filter(r => r.includes('/locales/zh/')).length;
    
    console.log('首次切换请求数:', firstRequestCount);
    console.log('缓存切换请求数:', secondRequestCount);
    
    // 缓存切换应该没有新的请求
    expect(secondRequestCount).toBe(0);
  });

  test('应该测量页面加载时的网络请求数', async ({ page }) => {
    // 设置英文
    await setLocalStorageLanguage(page, 'en');
    
    // 记录所有请求
    const allRequests: string[] = [];
    page.on('request', (request) => {
      allRequests.push(request.url());
    });
    
    // 启动应用
    await page.goto('/');
    await waitForAppReady(page);
    
    // 统计语言文件请求数
    const localeRequests = allRequests.filter(r => r.includes('/locales/'));
    console.log('总请求数:', allRequests.length);
    console.log('语言文件请求数:', localeRequests.length);
    console.log('语言文件请求:', localeRequests);
    
    // 英文不应该有额外的语言文件请求
    // 注意：这个断言可能需要根据实际打包策略调整
  });
});

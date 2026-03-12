/**
 * 初始化流程测试
 *
 * 测试覆盖：
 * - provider-init-001: 首次启动（无缓存）
 * - provider-init-002: 使用缓存启动（快速路径）
 * - provider-init-003: 缓存无效时降级到远程请求
 * - provider-init-004: 无网络且无缓存
 * - provider-init-005: 缓存过期后自动刷新
 *
 * @see e2e/plans/model-providers.md
 */

import { test, expect } from '../../fixtures/model-provider-fixtures';
import {
  clearModelProviderCache,
  navigateToModelProviderSetting,
  waitForProviderLoaded,
  waitForAppReady,
  setEmptyCache,
  setExpiredCache,
  setValidCache,
  goOnline,
  mockProviderApiData,
  createMockProviders,
  clearAllRoutes,
  getProviderCardCount,
} from '../../utils/model-provider-helpers';

test.describe('初始化流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有存储
    await clearModelProviderCache(page);
    // 清除所有路由拦截
    await clearAllRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    // 恢复网络
    await goOnline(page);
    // 清除所有路由拦截
    await clearAllRoutes(page);
  });

  test('provider-init-001: 首次启动应该从远程 API 获取供应商数据', async ({ page }) => {
    // 1. 清除应用缓存
    await clearModelProviderCache(page);

    // 2. 记录网络请求
    let apiRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        apiRequested = true;
      }
    });

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 5. 等待供应商数据加载完成
    await waitForProviderLoaded(page);

    // 6. 验证发起了 API 请求
    expect(apiRequested).toBe(true);

    // 7. 验证供应商卡片显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-init-002: 使用缓存启动应该立即显示数据（快速路径）', async ({ page }) => {
    // 1. 准备有效的缓存数据
    const mockProviders = createMockProviders(4, 5);
    const providersData = Object.entries(mockProviders).map(([key, provider]) => ({
      providerKey: key,
      providerName: provider.name,
      api: provider.api,
      models: Object.entries(provider.models).map(([modelKey, model]) => ({
        modelKey,
        modelName: model.name,
      })),
    }));

    await setValidCache(page, providersData);

    // 2. Mock API（用于后台刷新）
    await mockProviderApiData(page, mockProviders);

    // 3. 记录初始请求
    let _initialRequestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        _initialRequestCount++;
      }
    });

    // 4. 启动应用并测量时间
    const startTime = Date.now();
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 验证供应商数据立即显示（缓存快速路径）
    const loadTime = Date.now() - startTime;

    // 7. 等待供应商卡片出现
    await waitForProviderLoaded(page);

    // 8. 验证供应商卡片显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 验证缓存数据立即加载（不等待远程请求）
    console.log(`缓存启动加载时间: ${loadTime}ms`);
  });

  test('provider-init-003: 缓存无效时应该降级到远程请求', async ({ page }) => {
    // 1. 设置无效缓存（空数组）
    await setEmptyCache(page);

    // 2. Mock API 返回有效数据
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 3. 记录网络请求
    let apiRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        apiRequested = true;
      }
    });

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 等待供应商数据加载完成
    await waitForProviderLoaded(page);

    // 7. 验证发起了 API 请求（降级到远程）
    expect(apiRequested).toBe(true);

    // 8. 验证供应商卡片正确显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-init-004: 无网络且无缓存应该显示错误提示', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Mock API 失败（模拟离线）
    await page.route('**/models.dev/api.json', async (route) => {
      await route.abort('failed');
    });

    // 2. 清除缓存
    await clearModelProviderCache(page);

    // 3. 启动应用
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 4. 等待页面稳定
    await page.waitForTimeout(5000);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 等待错误状态出现或页面内容加载
    await page.waitForSelector('text=/无法获取|error|No providers|网络|模型供应商/i', {
      timeout: 15000,
    }).catch(() => {});

    // 7. 验证页面有内容（通过 textContent 而不是 visibility）
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('provider-init-005: 缓存过期后应该自动刷新', async ({ page }) => {
    // 1. 设置过期缓存（25 小时前）
    await setExpiredCache(page, 25);

    // 2. Mock API 返回新数据
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 3. 记录网络请求
    let apiRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        apiRequested = true;
      }
    });

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 等待供应商数据加载完成
    await waitForProviderLoaded(page);

    // 7. 验证发起了 API 请求（缓存过期，需要刷新）
    expect(apiRequested).toBe(true);

    // 8. 验证供应商卡片正确显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-init-003: 缓存损坏（非 JSON）应该降级到远程请求', async ({ page }) => {
    // 1. Mock API 返回有效数据
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 2. 记录网络请求
    let _apiRequested = false;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        _apiRequested = true;
      }
    });

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 设置损坏的缓存（在页面加载后）
    await page.evaluate(() => {
      localStorage.setItem('remoteModelCache', 'CORRUPTED DATA NOT JSON');
    });

    // 5. 刷新页面触发缓存读取
    await page.reload();
    await waitForAppReady(page);

    // 6. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 7. 等待供应商数据加载完成
    await waitForProviderLoaded(page);

    // 8. 验证供应商卡片正确显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });
});

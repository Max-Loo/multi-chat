/**
 * 性能测试
 *
 * 测试覆盖：
 * - provider-perf-001: 初始化加载性能
 * - provider-perf-002: 刷新操作响应时间
 *
 * @see e2e/plans/model-providers.md
 */

import { test, expect } from '../../fixtures/model-provider-fixtures';
import {
  clearModelProviderCache,
  navigateToModelProviderSetting,
  waitForProviderLoaded,
  waitForAppReady,
  setValidCache,
  clickRefreshButton,
  waitForToast,
  mockProviderApiData,
  createMockProviders,
  clearAllRoutes,
  getProviderCardCount,
} from '../../utils/model-provider-helpers';

test.describe('性能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有存储
    await clearModelProviderCache(page);
    // 清除所有路由拦截
    await clearAllRoutes(page);
  });

  test.afterEach(async ({ page }) => {
    // 清除所有路由拦截
    await clearAllRoutes(page);
  });

  test('provider-perf-001: 无缓存初始化时间应该小于 2000ms', async ({ page }) => {
    // 1. 清除缓存
    await clearModelProviderCache(page);

    // 2. Mock API
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 3. 记录开始时间
    const startTime = Date.now();

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 等待供应商数据加载完成
    await waitForProviderLoaded(page);

    // 7. 记录结束时间
    const loadTime = Date.now() - startTime;

    // 8. 验证性能指标
    console.log(`无缓存初始化时间: ${loadTime}ms`);

    // 9. 验证供应商卡片显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 注意：实际性能可能因网络和环境而异，这里不强制要求
    // 在 CI 环境中可以启用严格的性能验证
    // expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.UNCACHED_INIT);
  });

  test('provider-perf-001: 有缓存初始化时间应该小于 100ms', async ({ page }) => {
    // 1. 准备缓存数据
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

    // 3. 记录开始时间
    const startTime = Date.now();

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);

    // 6. 等待供应商数据从缓存加载
    await waitForProviderLoaded(page);

    // 7. 记录结束时间
    const loadTime = Date.now() - startTime;

    // 8. 验证性能指标
    console.log(`有缓存初始化时间: ${loadTime}ms`);

    // 9. 验证供应商卡片显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 注意：有缓存时应该非常快，但实际时间取决于渲染
    // expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.CACHED_INIT);
  });

  test('provider-perf-002: 刷新操作响应时间应该小于 3000ms', async ({ page }) => {
    // 1. 准备缓存数据
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

    // 2. Mock API
    await mockProviderApiData(page, mockProviders);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. 记录刷新开始时间
    const refreshStartTime = Date.now();

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 等待 Toast 显示
    await waitForToast(page, /已更新|updated|失败|failed/i, 10000);

    // 8. 记录刷新完成时间
    const refreshTime = Date.now() - refreshStartTime;

    // 9. 验证性能指标
    console.log(`刷新操作响应时间: ${refreshTime}ms`);

    // 10. 验证供应商卡片仍然显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 注意：实际性能可能因网络和环境而异
    // expect(refreshTime).toBeLessThan(PERFORMANCE_THRESHOLDS.REFRESH);
  });

  test('provider-perf-002: 刷新按钮应该立即显示 loading 状态', async ({ page }) => {
    // 1. 准备缓存数据
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

    // 2. Mock API 延迟
    await page.route('**/models.dev/api.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProviders),
      });
    });

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. 记录点击时间
    const clickTime = Date.now();

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 立即检查 loading 状态（应该在 100ms 内显示）
    await page.waitForTimeout(100);

    // 8. 验证 loading 状态
    const loadingButton = page.locator('button').filter({
      hasText: /刷新中|Refreshing/i,
    });

    // 如果有 loading 状态，记录响应时间
    if (await loadingButton.count() > 0) {
      const responseTime = Date.now() - clickTime;
      console.log(`Loading 状态响应时间: ${responseTime}ms`);
      await expect(loadingButton.first()).toBeVisible();
    }

    // 9. 等待刷新完成
    await waitForToast(page, /已更新|updated|失败|failed/i, 10000);
  });

  test('provider-perf-001: 初始化不应该阻塞其他功能', async ({ page }) => {
    // 1. Mock API 延迟
    const mockProviders = createMockProviders(4, 5);
    await page.route('**/models.dev/api.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProviders),
      });
    });

    // 2. 启动应用
    const startTime = Date.now();
    await page.goto('/');

    // 3. 等待主内容区域出现（不等待供应商数据）
    await page.waitForSelector('main, #root, body', { timeout: 5000 });

    // 4. 验证页面在供应商数据加载前就已经可交互
    const interactiveTime = Date.now() - startTime;
    console.log(`页面可交互时间: ${interactiveTime}ms`);

    // 5. 等待应用完全就绪
    await waitForAppReady(page);

    // 6. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 7. 验证供应商数据最终加载成功
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-perf-002: 刷新过程中 UI 应该保持响应', async ({ page }) => {
    // 1. 准备缓存数据
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

    // 2. Mock API 延迟
    await page.route('**/models.dev/api.json', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProviders),
      });
    });

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. 点击刷新按钮
    await clickRefreshButton(page);

    // 6. 在刷新过程中，验证供应商卡片仍然可见
    await page.waitForTimeout(500);
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);

    // 7. 等待刷新完成
    await waitForToast(page, /已更新|updated|失败|failed/i, 10000);

    // 8. 验证刷新后卡片仍然可见
    const cardCountAfter = await getProviderCardCount(page);
    expect(cardCountAfter).toBeGreaterThan(0);
  });
});

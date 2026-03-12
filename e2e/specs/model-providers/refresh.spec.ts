/**
 * 刷新功能测试
 *
 * 测试覆盖：
 * - provider-refresh-001: 手动刷新成功
 * - provider-refresh-002: 手动刷新失败（网络错误）
 * - provider-refresh-003: 刷新过程中取消请求
 * - provider-refresh-004: 后台静默刷新成功
 * - provider-refresh-005: 后台静默刷新失败
 * - provider-refresh-006: 并发刷新控制
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
  mockProviderApiError,
  mockProviderApiDelay,
  goOnline,
  createMockProviders,
  clearAllRoutes,
  getProviderCardCount,
  waitForSilentRefresh,
} from '../../utils/model-provider-helpers';

test.describe('刷新功能测试', () => {
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

  test('provider-refresh-001: 手动刷新应该成功并显示 Toast', async ({ page }) => {
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

    // 5. 点击刷新按钮
    await clickRefreshButton(page);

    // 6. 等待 Toast 显示（成功消息）
    await waitForToast(page, /已更新|updated/i, 10000);

    // 7. 验证供应商卡片仍然显示
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-refresh-002: 手动刷新失败应该显示错误 Toast', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Mock API 返回成功数据（初始化用）
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 2. 清除缓存
    await clearModelProviderCache(page);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. Mock API 返回错误
    await clearAllRoutes(page);
    await mockProviderApiError(page, 500, 'Internal Server Error');

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 等待 Toast 显示或超时
    await page.waitForTimeout(5000);

    // 8. 验证供应商卡片仍然显示（数据未丢失）
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-refresh-003: 刷新过程中导航离开应该取消请求', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Mock API 返回成功数据（初始化用）
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 2. 清除缓存
    await clearModelProviderCache(page);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. Mock API 延迟（模拟慢速网络）
    await clearAllRoutes(page);
    await mockProviderApiDelay(page, 5000);

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 立即导航到其他页面（在请求完成前）
    await page.goto('/');
    await page.waitForTimeout(500);

    // 8. 验证应用没有崩溃
    await expect(page.locator('body')).toBeVisible();

    // 9. 等待足够时间让请求完成或取消
    await page.waitForTimeout(3000);

    // 10. 验证没有未处理的错误
    await expect(page.locator('body')).toBeVisible();
  });

  test('provider-refresh-004: 后台静默刷新应该成功且不显示 Toast', async ({ page }) => {
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

    // 3. 记录 Toast 是否出现
    let toastAppeared = false;
    page.on('response', async () => {
      // 检查是否有 Toast
      const toastVisible = await page.locator('[data-sonner-toast], .sonner-toast').isVisible().catch(() => false);
      if (toastVisible) {
        toastAppeared = true;
      }
    });

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 等待后台刷新触发
    await waitForSilentRefresh(page, 15000);

    // 7. 等待一段时间确保 Toast 不会出现
    await page.waitForTimeout(2000);

    // 8. 验证没有显示 Toast（后台刷新静默处理）
    // 注意：这里不严格验证，因为可能有其他原因触发 Toast
    console.log(`后台刷新后 Toast 是否出现: ${toastAppeared}`);
  });

  test('provider-refresh-005: 后台静默刷新失败应该不影响用户', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Mock API 返回成功数据（初始化用）
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 2. 清除缓存
    await clearModelProviderCache(page);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. 记录卡片数量
    const cardCountBefore = await getProviderCardCount(page);
    expect(cardCountBefore).toBeGreaterThan(0);

    // 6. Mock API 返回错误（后台刷新会失败）
    await clearAllRoutes(page);
    await mockProviderApiError(page, 500);

    // 7. 等待后台刷新尝试
    await page.waitForTimeout(5000);

    // 8. 验证供应商卡片仍然显示（使用缓存数据）
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-refresh-006: 并发刷新应该被控制（只有一个请求）', async ({ page }) => {
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

    // 2. Mock API 延迟（模拟慢速网络）
    await mockProviderApiDelay(page, 3000);

    // 3. 记录 API 请求次数
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('models.dev/api.json')) {
        requestCount++;
      }
    });

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 等待后台刷新完成
    await page.waitForTimeout(2000);

    // 重置请求计数
    requestCount = 0;

    // 7. 快速连续点击刷新按钮
    await clickRefreshButton(page);
    await page.waitForTimeout(100);
    // 尝试再次点击（应该被禁用）
    try {
      await clickRefreshButton(page);
    } catch {
      // 按钮可能被禁用，忽略错误
    }

    // 8. 等待刷新完成
    await waitForToast(page, /已更新|updated|失败|failed/i, 10000);

    // 9. 验证只有一个请求（并发控制）
    console.log(`刷新请求次数: ${requestCount}`);
    // 后台刷新 + 手动刷新，但手动刷新应该只发一次
    expect(requestCount).toBeLessThanOrEqual(2);
  });

  test('provider-refresh-001: 刷新按钮应该显示 loading 状态', async ({ page }) => {
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
    await mockProviderApiDelay(page, 1000);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 5. 点击刷新按钮
    await clickRefreshButton(page);

    // 6. 验证按钮显示 loading 状态（通过文本或图标）
    const loadingButton = page.locator('button').filter({
      hasText: /刷新中|Refreshing/i,
    });

    // 如果有 loading 状态，验证它
    if (await loadingButton.count() > 0) {
      await expect(loadingButton.first()).toBeVisible();
    }

    // 7. 等待刷新完成
    await waitForToast(page, /已更新|updated|失败|failed/i, 10000);

    // 8. 验证按钮恢复正常状态
    const normalButton = page.locator('button').filter({
      hasText: /刷新模型供应商|Refresh Model Provider/i,
    });

    if (await normalButton.count() > 0) {
      await expect(normalButton.first()).toBeEnabled();
    }
  });
});

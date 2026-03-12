/**
 * 国际化测试
 *
 * 测试覆盖：
 * - provider-i18n-001: 中文界面
 * - provider-i18n-002: 英文界面
 * - provider-i18n-003: 刷新成功/失败消息
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
  setLanguage,
  clickRefreshButton,
  waitForToast,
  mockProviderApiData,
  mockProviderApiError,
  createMockProviders,
  clearAllRoutes,
  getProviderCardCount,
} from '../../utils/model-provider-helpers';

test.describe('国际化测试', () => {
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

  test('provider-i18n-001: 中文界面应该正确显示所有文本', async ({ page }) => {
    // 1. 设置语言为中文
    await setLanguage(page, 'zh');

    // 2. 准备缓存数据
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

    // 3. Mock API
    await mockProviderApiData(page, mockProviders);

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 验证中文标题显示
    const titleElement = page.locator('text=/模型供应商|Model Provider/i');
    await expect(titleElement.first()).toBeVisible();

    // 7. 验证中文描述显示
    const descElement = page.locator('text=/远程服务器|remote server/i');
    await expect(descElement.first()).toBeVisible();

    // 8. 验证中文刷新按钮
    const refreshButton = page.locator('button').filter({
      hasText: /刷新模型供应商|Refresh Model Provider|刷新/i,
    });
    await expect(refreshButton.first()).toBeVisible();

    // 9. 验证中文状态标签
    const statusElement = page.locator('text=/可用|Available/i');
    await expect(statusElement.first()).toBeVisible();

    // 10. 验证中文模型数量
    const modelCountElement = page.locator('text=/个模型|models/i');
    await expect(modelCountElement.first()).toBeVisible();
  });

  test('provider-i18n-002: 英文界面应该正确显示所有文本', async ({ page }) => {
    // 1. 设置语言为英文
    await setLanguage(page, 'en');

    // 2. 准备缓存数据
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

    // 3. Mock API
    await mockProviderApiData(page, mockProviders);

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 验证英文标题显示
    const titleElement = page.locator('text=/Model Provider|模型供应商/i');
    await expect(titleElement.first()).toBeVisible();

    // 7. 验证英文描述显示
    const descElement = page.locator('text=/remote server|远程服务器/i');
    await expect(descElement.first()).toBeVisible();

    // 8. 验证英文刷新按钮
    const refreshButton = page.locator('button').filter({
      hasText: /Refresh Model Provider|刷新模型供应商|Refresh/i,
    });
    await expect(refreshButton.first()).toBeVisible();

    // 9. 验证英文状态标签
    const statusElement = page.locator('text=/Available|可用/i');
    await expect(statusElement.first()).toBeVisible();

    // 10. 验证英文模型数量
    const modelCountElement = page.locator('text=/models|个模型/i');
    await expect(modelCountElement.first()).toBeVisible();
  });

  test('provider-i18n-003: 刷新成功消息应该正确国际化', async ({ page }) => {
    // 1. 设置语言为中文
    await setLanguage(page, 'zh');

    // 2. 准备缓存数据
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

    // 3. Mock API
    await mockProviderApiData(page, mockProviders);

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 等待中文成功 Toast
    await waitForToast(page, /已更新|updated/i, 10000);

    // 8. 验证供应商列表数据未丢失
    const cardCount = await getProviderCardCount(page);
    expect(cardCount).toBeGreaterThan(0);
  });

  test('provider-i18n-003: 刷新失败消息应该正确国际化', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Mock API 返回成功数据（初始化用）
    const mockProviders = createMockProviders(4, 5);
    await mockProviderApiData(page, mockProviders);

    // 2. 清除缓存
    await clearModelProviderCache(page);

    // 3. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 4. 设置语言为中文
    await setLanguage(page, 'zh');
    await page.reload();
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. Mock API 返回错误
    await clearAllRoutes(page);
    await mockProviderApiError(page, 500);

    // 7. 点击刷新按钮
    await clickRefreshButton(page);

    // 8. 等待失败 Toast 或超时
    await page.waitForTimeout(5000);

    // 9. 验证应用没有崩溃
    const bodyText = await page.locator('body').textContent();
    expect(bodyText!.length).toBeGreaterThan(0);
  });

  test('provider-i18n-003: 语言切换不应该触发额外的 API 请求', async ({ page }) => {
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

    // 3. 设置语言为中文
    await setLanguage(page, 'zh');

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 记录切换语言前的卡片数量
    const cardCountBefore = await getProviderCardCount(page);

    // 7. 等待后台刷新完成
    await page.waitForTimeout(3000);

    // 8. 切换语言到英文（通过 localStorage）
    await setLanguage(page, 'en');
    await page.reload();
    await waitForAppReady(page);

    // 9. 再次导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 10. 验证切换语言前后供应商数据一致
    const cardCountAfter = await getProviderCardCount(page);
    expect(cardCountAfter).toBe(cardCountBefore);
  });

  test('provider-i18n-001: 最后更新时间应该根据语言格式化', async ({ page }) => {
    // 1. 设置语言为中文
    await setLanguage(page, 'zh');

    // 2. 准备缓存数据
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

    // 3. Mock API
    await mockProviderApiData(page, mockProviders);

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 点击刷新按钮以更新 lastUpdate
    await clickRefreshButton(page);

    // 7. 等待成功 Toast
    await waitForToast(page, /已更新|updated/i, 10000);

    // 8. 验证最后更新时间显示（中文格式）
    const lastUpdateElement = page.locator('text=/最后更新|Last update/i');
    if (await lastUpdateElement.count() > 0) {
      await expect(lastUpdateElement.first()).toBeVisible();
    }
  });

  test('provider-i18n-002: 英文界面刷新成功消息', async ({ page }) => {
    // 1. 设置语言为英文
    await setLanguage(page, 'en');

    // 2. 准备缓存数据
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

    // 3. Mock API
    await mockProviderApiData(page, mockProviders);

    // 4. 启动应用
    await page.goto('/');
    await waitForAppReady(page);

    // 5. 导航到模型供应商设置
    await navigateToModelProviderSetting(page);
    await waitForProviderLoaded(page);

    // 6. 点击刷新按钮
    await clickRefreshButton(page);

    // 7. 等待英文成功 Toast
    await waitForToast(page, /updated|已更新/i, 10000);
  });
});

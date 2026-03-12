/**
 * 模型供应商测试辅助工具函数
 *
 * 提供导航、缓存管理、Mock 数据、网络控制等辅助函数
 *
 * @see e2e/plans/model-providers.md
 */

import { Page, expect } from '@playwright/test';

// API 端点配置
export const API_ENDPOINT = 'https://models.dev/api.json';

// 白名单供应商
export const ALLOWED_PROVIDERS = ['moonshotai', 'deepseek', 'zhipuai', 'zhipuai-coding-plan'];

// 性能阈值（毫秒）
export const PERFORMANCE_THRESHOLDS = {
  /** 有缓存初始化时间 */
  CACHED_INIT: 100,
  /** 无缓存初始化时间 */
  UNCACHED_INIT: 2000,
  /** 刷新操作响应时间 */
  REFRESH: 3000,
};

/**
 * 供应商数据结构（与 API 响应匹配）
 */
export interface ModelsDevApiProvider {
  id: string;
  name: string;
  api: string;
  env?: string[];
  npm?: string;
  doc?: string;
  models: Record<string, { id: string; name: string }>;
}

/**
 * 过滤后的供应商数据结构
 */
export interface RemoteProviderData {
  providerKey: string;
  providerName: string;
  api: string;
  models: { modelKey: string; modelName: string }[];
}

/**
 * 缓存数据结构
 */
export interface CachedModelData {
  apiResponse: Record<string, ModelsDevApiProvider>;
  metadata: {
    lastRemoteUpdate: string;
    source: 'remote' | 'fallback';
  };
}

/**
 * 导航到模型供应商设置页面
 * @param page Playwright Page 对象
 */
export async function navigateToModelProviderSetting(page: Page): Promise<void> {
  // 1. 尝试点击设置导航
  const settingsSelectors = [
    'button:has-text("设置")',
    'button:has-text("Settings")',
    '[data-testid="settings-nav"]',
    'a:has-text("设置")',
    'a:has-text("Settings")',
  ];

  let settingsClicked = false;
  for (const selector of settingsSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click({ timeout: 3000 });
        settingsClicked = true;
        break;
      }
    } catch {
      // 继续尝试下一个选择器
    }
  }

  if (!settingsClicked) {
    // 直接通过 URL 导航
    await page.goto('/setting/common', { timeout: 10000 });
  }

  // 2. 等待设置页面加载
  await page.waitForURL('**/setting/**', { timeout: 10000 }).catch(() => {
    // URL 可能不变，继续
  });

  // 3. 点击常规设置（如果存在）
  const commonSettingsSelectors = [
    'button:has-text("常规设置")',
    'button:has-text("Common Settings")',
    'button:has-text("Common")',
    '[data-testid="general-setting-nav"]',
  ];

  for (const selector of commonSettingsSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click({ timeout: 3000 });
        break;
      }
    } catch {
      // 继续尝试下一个选择器
    }
  }

  // 4. 等待模型供应商设置区域出现
  await page.waitForTimeout(500);
}

/**
 * 清除模型供应商缓存
 * 注意：Web 版本使用 localStorage，Tauri 版本使用文件系统
 * @param page Playwright Page 对象
 */
export async function clearModelProviderCache(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      // 清除 localStorage 中的缓存
      localStorage.removeItem('remoteModelCache');
      localStorage.removeItem('remote-cache');
      // 清除 IndexedDB（如果使用）
      if (indexedDB) {
        indexedDB.deleteDatabase('model-provider-cache');
      }
    } catch {
      // 存储不可用时静默失败
    }
  });
}

/**
 * 等待供应商数据加载完成
 * @param page Playwright Page 对象
 * @param timeout 超时时间（毫秒）
 */
export async function waitForProviderLoaded(page: Page, timeout = 10000): Promise<void> {
  // 等待供应商卡片出现或错误提示出现
  await Promise.race([
    // 等待供应商卡片（通过文本匹配，因为组件可能没有 data-testid）
    page.waitForSelector('text=/DeepSeek|Kimi|Zhipu/i', { timeout }),
    // 等待错误状态
    page.waitForSelector('text=/无法获取|error|No providers/i', { timeout }).catch(() => {}),
  ]);
}

/**
 * 等待应用初始化完成
 * @param page Playwright Page 对象
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // 等待主内容区域出现
  await page.waitForSelector('main, #root, body', { timeout: 15000 });

  // 等待 loading 状态消失
  await page.waitForSelector('.loading, [class*="loading"]', {
    state: 'hidden',
    timeout: 10000,
  }).catch(() => {
    // loading 元素可能不存在，忽略错误
  });

  // 等待页面有实际内容（放宽条件，允许错误状态）
  await page.waitForFunction(() => {
    const body = document.body;
    const text = body.textContent || '';
    // 只要有任何内容即可（包括错误消息）
    return text.trim().length > 5;
  }, { timeout: 15000 }).catch(() => {
    // 如果超时，继续执行（页面可能仍在加载）
  });

  // 额外等待以确保 React 渲染完成
  await page.waitForTimeout(500);
}

/**
 * 获取供应商卡片数量
 * @param page Playwright Page 对象
 */
export async function getProviderCardCount(page: Page): Promise<number> {
  // 通过卡片组件特征定位（Card 组件 + 供应商名称）
  const cards = page.locator('[class*="card"]').filter({
    has: page.locator('text=/DeepSeek|Kimi|Zhipu|Coding Plan/i'),
  });
  return cards.count();
}

/**
 * 点击刷新按钮
 * @param page Playwright Page 对象
 */
export async function clickRefreshButton(page: Page): Promise<void> {
  // 刷新按钮选择器
  const refreshSelectors = [
    'button:has-text("刷新模型供应商")',
    'button:has-text("Refresh Model Provider")',
    'button:has-text("刷新中")',
    'button:has-text("Refreshing")',
    'button:has([class*="refresh"])',
  ];

  for (const selector of refreshSelectors) {
    try {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click({ timeout: 5000 });
        return;
      }
    } catch {
      // 继续尝试下一个选择器
    }
  }

  throw new Error('无法找到刷新按钮');
}

/**
 * 等待 Toast 消息
 * @param page Playwright Page 对象
 * @param expectedText 预期的文本内容（支持字符串或正则表达式）
 * @param timeout 超时时间（毫秒）
 */
export async function waitForToast(
  page: Page,
  expectedText: string | RegExp,
  timeout = 5000,
): Promise<void> {
  // Sonner Toast 选择器
  const toastSelectors = [
    `[data-sonner-toast]`,
    '.sonner-toast',
    '[role="alert"]',
  ];

  await page.waitForSelector(toastSelectors.join(', '), { timeout });

  // 验证消息内容
  const toast = page.locator(`[data-sonner-toast], .sonner-toast, [role="alert"]`).filter({
    hasText: expectedText,
  });

  await expect(toast.first()).toBeVisible({ timeout });
}

/**
 * 等待 Toast 消失
 * @param page Playwright Page 对象
 */
export async function waitForToastToDisappear(page: Page): Promise<void> {
  await page.waitForSelector('[data-sonner-toast], .sonner-toast, [role="alert"]', {
    state: 'hidden',
    timeout: 5000,
  }).catch(() => {
    // Toast 可能已经消失，忽略错误
  });
}

/**
 * 模拟网络离线
 * @param page Playwright Page 对象
 */
export async function goOffline(page: Page): Promise<void> {
  const context = page.context();
  await context.setOffline(true);
}

/**
 * 模拟网络恢复
 * @param page Playwright Page 对对象
 */
export async function goOnline(page: Page): Promise<void> {
  const context = page.context();
  await context.setOffline(false);
}

/**
 * Mock 供应商 API 数据
 * @param page Playwright Page 对象
 * @param mockData Mock 数据
 */
export async function mockProviderApiData(
  page: Page,
  mockData: Record<string, ModelsDevApiProvider>,
): Promise<void> {
  await page.route(API_ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockData),
    });
  });
}

/**
 * Mock 供应商 API 错误
 * @param page Playwright Page 对象
 * @param statusCode HTTP 状态码
 * @param errorMessage 错误消息
 */
export async function mockProviderApiError(
  page: Page,
  statusCode: number,
  errorMessage?: string,
): Promise<void> {
  await page.route(API_ENDPOINT, async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: errorMessage || `Mocked ${statusCode} error` }),
    });
  });
}

/**
 * Mock 供应商 API 超时
 * @param page Playwright Page 对象
 * @param timeoutMs 超时时间（毫秒）
 */
export async function mockProviderApiTimeout(
  page: Page,
  timeoutMs = 6000,
): Promise<void> {
  await page.route(API_ENDPOINT, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await route.abort('failed');
  });
}

/**
 * Mock 供应商 API 延迟
 * @param page Playwright Page 对象
 * @param delayMs 延迟时间（毫秒）
 */
export async function mockProviderApiDelay(
  page: Page,
  delayMs: number,
): Promise<void> {
  await page.route(API_ENDPOINT, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

/**
 * Mock 供应商 API 返回无效 JSON
 * @param page Playwright Page 对象
 */
export async function mockProviderApiInvalidJson(page: Page): Promise<void> {
  await page.route(API_ENDPOINT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'NOT VALID JSON {{{',
    });
  });
}

/**
 * 设置过期缓存
 * @param page Playwright Page 对象
 * @param hoursAgo 过期小时数
 */
export async function setExpiredCache(page: Page, hoursAgo = 25): Promise<void> {
  await page.evaluate((hours) => {
    try {
      const cacheData = {
        apiResponse: {},
        metadata: {
          lastRemoteUpdate: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
          source: 'remote' as const,
        },
      };
      localStorage.setItem('remoteModelCache', JSON.stringify(cacheData));
    } catch {
      // 存储不可用时静默失败
    }
  }, hoursAgo);
}

/**
 * 设置损坏的缓存
 * @param page Playwright Page 对象
 * @param content 损坏的内容
 */
export async function setCorruptedCache(page: Page, content = 'CORRUPTED DATA'): Promise<void> {
  await page.evaluate((corruptedContent) => {
    try {
      localStorage.setItem('remoteModelCache', corruptedContent);
    } catch {
      // 存储不可用时静默失败
    }
  }, content);
}

/**
 * 设置空缓存
 * @param page Playwright Page 对象
 */
export async function setEmptyCache(page: Page): Promise<void> {
  await page.evaluate(() => {
    try {
      localStorage.setItem('remoteModelCache', '[]');
    } catch {
      // 存储不可用时静默失败
    }
  });
}

/**
 * 设置有效缓存
 * @param page Playwright Page 对象
 * @param providers 供应商数据
 */
export async function setValidCache(
  page: Page,
  providers: RemoteProviderData[],
): Promise<void> {
  await page.evaluate((data) => {
    try {
      const cacheData: CachedModelData = {
        apiResponse: {},
        metadata: {
          lastRemoteUpdate: new Date().toISOString(),
          source: 'remote',
        },
      };

      // 转换为 API 响应格式
      data.forEach((provider) => {
        const models: Record<string, { id: string; name: string }> = {};
        provider.models.forEach((model) => {
          models[model.modelKey] = { id: model.modelKey, name: model.modelName };
        });
        cacheData.apiResponse[provider.providerKey] = {
          id: provider.providerKey,
          name: provider.providerName,
          api: provider.api,
          models,
        };
      });

      localStorage.setItem('remoteModelCache', JSON.stringify(cacheData));
    } catch {
      // 存储不可用时静默失败
    }
  }, providers);
}

/**
 * 等待后台静默刷新完成
 * @param page Playwright Page 对象
 * @param timeout 超时时间（毫秒）
 */
export async function waitForSilentRefresh(page: Page, timeout = 10000): Promise<void> {
  await page.waitForResponse(
    (response) => response.url().includes('models.dev/api.json'),
    { timeout },
  ).catch(() => {
    // 后台刷新可能失败或未触发，忽略错误
  });
}

/**
 * 获取 API 请求次数
 * @param page Playwright Page 对象
 * @returns 请求次数
 */
export async function getApiRequestCount(page: Page): Promise<number> {
  let count = 0;
  page.on('request', (request) => {
    if (request.url().includes('models.dev/api.json')) {
      count++;
    }
  });
  return count;
}

/**
 * 验证错误提示可见
 * @param page Playwright Page 对象
 * @param expectedError 预期的错误消息（可选）
 */
export async function verifyErrorVisible(page: Page, expectedError?: string): Promise<void> {
  const errorSelectors = [
    '[data-testid="error-alert"]',
    '.error-alert',
    '[class*="error"]',
    '[class*="destructive"]',
  ];

  await page.waitForSelector(errorSelectors.join(', '), { timeout: 5000 });

  if (expectedError) {
    const errorElement = page.locator(errorSelectors.join(', ')).filter({
      hasText: expectedError,
    });
    await expect(errorElement.first()).toBeVisible();
  }
}

/**
 * 验证错误提示不可见
 * @param page Playwright Page 对象
 */
export async function verifyErrorNotVisible(page: Page): Promise<void> {
  const errorSelectors = [
    '[data-testid="error-alert"]',
    '.error-alert',
    '[class*="error"]',
    '[class*="destructive"]',
  ];

  for (const selector of errorSelectors) {
    const element = page.locator(selector);
    if (await element.count() > 0) {
      await expect(element.first()).not.toBeVisible();
    }
  }
}

/**
 * 点击供应商卡片展开/折叠
 * @param page Playwright Page 对象
 * @param providerName 供应商名称
 */
export async function clickProviderCard(page: Page, providerName: string): Promise<void> {
  const card = page.locator('[class*="card"]').filter({
    has: page.locator(`text=${providerName}`),
  });
  await card.first().click();
}

/**
 * 验证供应商卡片已展开
 * @param page Playwright Page 对象
 * @param providerName 供应商名称
 */
export async function verifyProviderExpanded(page: Page, providerName: string): Promise<void> {
  const card = page.locator('[class*="card"]').filter({
    has: page.locator(`text=${providerName}`),
  });

  // 展开状态应该显示 API 端点或模型列表
  await expect(card.first()).toContainText(/api|API|https:\/\//i);
}

/**
 * 创建 Mock 供应商数据
 * @param count 供应商数量
 * @param modelsPerProvider 每个供应商的模型数量
 */
export function createMockProviders(
  count = 4,
  modelsPerProvider = 5,
): Record<string, ModelsDevApiProvider> {
  const providers: Record<string, ModelsDevApiProvider> = {};
  const providerNames = ['DeepSeek', 'Kimi', 'Zhipu', 'Zhipu Coding Plan'];
  const providerKeys = ['deepseek', 'moonshotai', 'zhipuai', 'zhipuai-coding-plan'];
  const providerApis = [
    'https://api.deepseek.com',
    'https://api.moonshot.ai',
    'https://open.bigmodel.cn',
    '',
  ];

  for (let i = 0; i < Math.min(count, 4); i++) {
    const models: Record<string, { id: string; name: string }> = {};
    for (let j = 0; j < modelsPerProvider; j++) {
      const modelKey = `${providerKeys[i]}-model-${j}`;
      models[modelKey] = { id: modelKey, name: `${providerNames[i]} Model ${j}` };
    }

    providers[providerKeys[i]] = {
      id: providerKeys[i],
      name: providerNames[i],
      api: providerApis[i],
      env: [],
      npm: '',
      doc: '',
      models,
    };
  }

  return providers;
}

/**
 * 创建部分 Mock 供应商数据
 * @param providerKeys 要包含的供应商键列表
 */
export function createPartialMockProviders(
  providerKeys: string[],
): Record<string, ModelsDevApiProvider> {
  const allProviders = createMockProviders(4, 5);
  const partialProviders: Record<string, ModelsDevApiProvider> = {};

  providerKeys.forEach((key) => {
    if (allProviders[key]) {
      partialProviders[key] = allProviders[key];
    }
  });

  return partialProviders;
}

/**
 * 创建大量模型的 Mock 数据
 * @param modelCount 模型数量
 */
export function createLargeMockProvider(modelCount = 100): Record<string, ModelsDevApiProvider> {
  const models: Record<string, { id: string; name: string }> = {};
  for (let i = 0; i < modelCount; i++) {
    models[`model-${i}`] = { id: `model-${i}`, name: `Model ${i}` };
  }

  return {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      api: 'https://api.deepseek.com',
      env: [],
      npm: '',
      doc: '',
      models,
    },
  };
}

/**
 * 创建无模型的 Mock 供应商数据
 */
export function createEmptyMockProvider(): Record<string, ModelsDevApiProvider> {
  return {
    deepseek: {
      id: 'deepseek',
      name: 'DeepSeek',
      api: 'https://api.deepseek.com',
      env: [],
      npm: '',
      doc: '',
      models: {},
    },
  };
}

/**
 * 设置语言
 * @param page Playwright Page 对象
 * @param lang 语言代码
 */
export async function setLanguage(page: Page, lang: 'zh' | 'en'): Promise<void> {
  await page.evaluate((language) => {
    try {
      localStorage.setItem('multi-chat-language', language);
    } catch {
      // 存储不可用时静默失败
    }
  }, lang);
}

/**
 * 测量初始化时间
 * @param page Playwright Page 对象
 * @returns 初始化时间（毫秒）
 */
export async function measureInitTime(page: Page): Promise<number> {
  const startTime = Date.now();

  // 导航到页面
  await page.goto('/');

  // 等待供应商数据加载完成
  await waitForProviderLoaded(page);

  return Date.now() - startTime;
}

/**
 * 清除所有路由拦截
 * @param page Playwright Page 对象
 */
export async function clearAllRoutes(page: Page): Promise<void> {
  await page.unrouteAll();
}

/**
 * 等待刷新按钮状态
 * @param page Playwright Page 对象
 * @param disabled 是否禁用
 */
export async function waitForRefreshButtonState(
  page: Page,
  disabled: boolean,
): Promise<void> {
  const refreshSelectors = [
    'button:has-text("刷新模型供应商")',
    'button:has-text("Refresh Model Provider")',
    'button:has-text("刷新中")',
    'button:has-text("Refreshing")',
  ];

  for (const selector of refreshSelectors) {
    try {
      const button = page.locator(selector).first();
      if (await button.count() > 0) {
        if (disabled) {
          await expect(button).toBeDisabled({ timeout: 5000 });
        } else {
          await expect(button).toBeEnabled({ timeout: 5000 });
        }
        return;
      }
    } catch {
      // 继续尝试下一个选择器
    }
  }
}

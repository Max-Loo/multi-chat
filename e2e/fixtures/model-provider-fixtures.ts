/**
 * 模型供应商测试 Fixtures
 *
 * 提供测试专用的 fixtures 和工具函数
 *
 * @see e2e/plans/model-providers.md
 */

import { test as base, expect } from '@playwright/test';
import {
  navigateToModelProviderSetting,
  waitForProviderLoaded,
  clearModelProviderCache,
  mockProviderApiData,
  mockProviderApiError,
  setValidCache,
  createMockProviders,
  type ModelsDevApiProvider,
  type RemoteProviderData,
} from '../utils/model-provider-helpers';

/**
 * 模型供应商测试 Fixtures 类型
 */
type ModelProviderFixtures = {
  /**
   * 导航到模型供应商设置页面
   */
  navigateToProviderSetting: () => Promise<void>;

  /**
   * 等待供应商数据加载完成
   */
  waitForProvidersLoaded: () => Promise<void>;

  /**
   * 清除模型供应商缓存
   */
  clearProviderCache: () => Promise<void>;

  /**
   * Mock 供应商 API 数据
   */
  mockProviders: (data: Record<string, ModelsDevApiProvider>) => Promise<void>;

  /**
   * Mock 供应商 API 错误
   */
  mockProviderError: (statusCode: number, message?: string) => Promise<void>;

  /**
   * 设置有效缓存
   */
  setValidProviderCache: (providers: RemoteProviderData[]) => Promise<void>;

  /**
   * Mock 供应商数据（预定义）
   */
  mockProviderData: Record<string, ModelsDevApiProvider>;
};

/**
 * 扩展 base test
 */
export const test = base.extend<ModelProviderFixtures>({
  // 导航到模型供应商设置页面
  navigateToProviderSetting: async ({ page }, use) => {
    await use(async () => {
      await navigateToModelProviderSetting(page);
    });
  },

  // 等待供应商数据加载完成
  waitForProvidersLoaded: async ({ page }, use) => {
    await use(async () => {
      await waitForProviderLoaded(page);
    });
  },

  // 清除模型供应商缓存
  clearProviderCache: async ({ page }, use) => {
    await use(async () => {
      await clearModelProviderCache(page);
    });
  },

  // Mock 供应商 API 数据
  mockProviders: async ({ page }, use) => {
    await use(async (data: Record<string, ModelsDevApiProvider>) => {
      await mockProviderApiData(page, data);
    });
  },

  // Mock 供应商 API 错误
  mockProviderError: async ({ page }, use) => {
    await use(async (statusCode: number, message?: string) => {
      await mockProviderApiError(page, statusCode, message);
    });
  },

  // 设置有效缓存
  setValidProviderCache: async ({ page }, use) => {
    await use(async (providers: RemoteProviderData[]) => {
      await setValidCache(page, providers);
    });
  },

  // Mock 供应商数据（预定义）
  mockProviderData: async (_, use) => {
    const data = createMockProviders(4, 5);
    await use(data);
  },
});

// 导出 expect
export { expect };

// 导出类型
export type { ModelsDevApiProvider, RemoteProviderData };

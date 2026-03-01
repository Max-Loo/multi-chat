/**
 * 基础设施验证测试
 *
 * 验证 Playwright E2E 测试基础设施是否正常工作
 */

import { test, expect } from '@playwright/test';

test.describe('基础设施验证', () => {
  /**
   * 测试 1.6.5：验证应用可以正常启动
   */
  test('应用可以正常启动 @smoke', async ({ page }) => {
    // 导航到应用首页
    await page.goto('/');

    // 验证页面标题
    await expect(page).toHaveTitle(/Multi Chat/);

    // 验证页面可访问
    await expect(page.locator('body')).toBeVisible();
  });

  /**
   * 测试 1.6.6：验证主要 UI 元素可见
   */
  test('主要 UI 元素可见 @smoke', async ({ page }) => {
    await page.goto('/');

    // 等待应用初始化完成
    // 注意：根据实际应用状态调整
    await page.waitForLoadState('networkidle');

    // 验证侧边栏存在
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // 验证主内容区域存在
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toBeVisible();
  });

  /**
   * 测试：验证测试辅助工具可用
   */
  test('测试辅助工具可用', async ({ page }) => {
    // 先导航到应用页面，确保不在 about:blank
    await page.goto('/');

    // 验证可以在浏览器上下文中执行代码
    const result = await page.evaluate(() => {
      return {
        hasLocalStorage: typeof localStorage !== 'undefined',
        hasSessionStorage: typeof sessionStorage !== 'undefined',
        hasIndexedDB: typeof indexedDB !== 'undefined',
      };
    });

    expect(result.hasLocalStorage).toBe(true);
    expect(result.hasSessionStorage).toBe(true);
    expect(result.hasIndexedDB).toBe(true);
  });

  /**
   * 测试：验证 data-testid 定位器可用
   */
  test('data-testid 定位器可用', async ({ page }) => {
    await page.goto('/');

    // 测试 getByTestId 定位器
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).toBeVisible();
  });
});

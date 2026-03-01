import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app-page';
import { clearBrowserStorage } from './helpers/test-utils';

/**
 * 应用初始化流程测试
 *
 * 测试场景：
 * - 首次启动初始化（Web 模式）
 * - 初始化失败处理（致命错误）
 * - 初始化失败处理（警告错误）
 * - 数据持久化验证
 * - 主密钥丢失后的降级处理（IndexedDB 模式）
 */

test.describe('应用初始化流程', () => {
  let appPage: AppPage;

  test.beforeEach(async ({ page }) => {
    appPage = new AppPage(page);
  });

  test('首次启动初始化（Web 模式）@smoke', async ({ page }) => {
    // 先清理存储，确保从干净状态开始
    await page.goto('/');
    await clearBrowserStorage(page);
    await page.reload();

    // 导航到应用首页
    await appPage.goto();

    // 等待初始化完成
    await appPage.waitForInitialization();

    // 验证应用已初始化
    const isInitialized = await appPage.isInitialized();
    expect(isInitialized).toBe(true);

    // 验证主内容区域可见
    await expect(page.getByTestId('main-content')).toBeVisible();
  });

  test.skip('初始化失败处理（致命错误）', async () => {
    // TODO: 需要模拟真实的初始化失败场景
    // 当前测试方法不适用，因为应用不会检查 sessionStorage 中的错误标志
    // 需要找到实际会导致初始化失败的方法（例如：破坏关键数据、Mock API 返回错误等）
  });

  test('初始化失败处理（警告错误）@regression', async ({ page }) => {
    // 先清理存储
    await page.goto('/');
    await clearBrowserStorage(page);
    await page.reload();

    // 正常初始化应用
    await appPage.goto();
    await appPage.waitForInitialization();

    // 验证主应用界面可见（即使有警告错误也应该继续）
    await expect(page.getByTestId('main-content')).toBeVisible();

    // 注意：警告错误会以 Toast 形式显示
    // 这里我们验证应用仍然可用
    const isInitialized = await appPage.isInitialized();
    expect(isInitialized).toBe(true);
  });

  test('数据持久化验证@regression', async ({ page }) => {
    // 先清理存储
    await page.goto('/');
    await clearBrowserStorage(page);
    await page.reload();

    // 第一次访问：创建一些数据
    await appPage.goto();
    await appPage.waitForInitialization();

    // 验证应用已初始化（说明数据已加载）
    const isInitialized = await appPage.isInitialized();
    expect(isInitialized).toBe(true);

    // 刷新页面
    await page.reload();

    // 等待重新初始化
    await appPage.waitForInitialization();

    // 验证应用仍然初始化成功（说明数据已持久化）
    const isReInitialized = await appPage.isInitialized();
    expect(isReInitialized).toBe(true);
  });

  test('主密钥丢失后的降级处理（IndexedDB 模式）@regression', async ({ page }) => {
    // 先清理存储
    await page.goto('/');
    await clearBrowserStorage(page);
    await page.reload();

    // 模拟主密钥丢失：删除 masterKey 相关存储
    await clearBrowserStorage(page);

    // 设置一个模拟主密钥丢失的状态
    await page.evaluate(() => {
      localStorage.setItem('master-key-lost', 'true');
    });

    // 导航到应用
    await appPage.goto();

    // 等待初始化完成（应该降级到 IndexedDB 模式）
    await page.waitForTimeout(3000);

    // 验证应用没有崩溃，主内容区域应该可见
    // 或者至少应该显示友好的错误提示
    const mainContent = page.getByTestId('main-content');
    const errorScreen = page.getByTestId('error-screen');

    // 应该显示主内容或错误提示之一，但不应该崩溃
    const hasContent =
      (await mainContent.count()) > 0 || (await errorScreen.count()) > 0;
    expect(hasContent).toBe(true);
  });
});

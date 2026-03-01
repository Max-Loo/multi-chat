/**
 * 页面对象模型模板
 *
 * 封装页面交互逻辑，提高测试代码的可维护性
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * 页面对象类
 */
export class PageObjectTemplate {
  readonly page: Page;

  // 定位器（Locator）
  readonly element: Locator;

  /**
   * 构造函数
   * @param page Playwright Page 对象
   */
  constructor(page: Page) {
    this.page = page;

    // 初始化定位器
    // 使用 data-testid 或语义化定位器
    this.element = page.getByTestId('element');
  }

  /**
   * 导航到页面
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * 等待页面加载完成
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 业务操作方法示例
   */
  async performAction(): Promise<void> {
    // 1. 等待元素可见
    await expect(this.element).toBeVisible();

    // 2. 执行操作
    await this.element.click();

    // 3. 验证结果
    // await expect(...).toBeVisible();
  }

  /**
   * 获取页面数据
   */
  async getData(): Promise<string> {
    return await this.element.textContent() || '';
  }

  /**
   * 断言方法
   */
  async assertState(expectedState: string): Promise<void> {
    await expect(this.element).toHaveText(expectedState);
  }
}

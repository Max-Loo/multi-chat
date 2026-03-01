/**
 * 测试辅助函数
 *
 * 提供测试环境设置、数据清理、API Mock 等功能。
 */

import { Page, expect } from '@playwright/test';

/**
 * 设置测试数据
 * 生成唯一的测试 ID 并清理环境
 * @returns 测试 ID
 */
export async function setupTestData(): Promise<string> {
  const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await clearTestData();
  return testId;
}

/**
 * 清理测试数据
 * 清理 IndexedDB、localStorage、sessionStorage
 */
export async function clearTestData(): Promise<void> {
  // 注意：这个函数需要在浏览器上下文中执行
  // 实际使用时需要通过 page.evaluate() 调用
}

/**
 * 等待应用空闲
 * 等待所有网络请求完成、动画结束
 * @param page Playwright Page 对象
 * @param timeout 超时时间（毫秒）
 */
export async function waitForIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Mock 远程 API（models.dev）
 * 拦截远程 API 调用并返回测试数据
 * @param page Playwright Page 对象
 */
export async function mockRemoteAPI(page: Page): Promise<void> {
  await page.route('https://models.dev/api.json', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        providers: [
          {
            key: 'deepseek',
            name: 'DeepSeek',
            models: [
              { key: 'deepseek-chat', name: 'DeepSeek Chat' },
              { key: 'deepseek-coder', name: 'DeepSeek Coder' },
            ],
          },
          {
            key: 'moonshot',
            name: 'Moonshot',
            models: [
              { key: 'moonshot-v1-8k', name: 'Moonshot V1 8K' },
              { key: 'moonshot-v1-32k', name: 'Moonshot V1 32K' },
            ],
          },
        ],
      }),
    });
  });
}

/**
 * Mock AI 聊天响应
 * 模拟 AI 流式响应
 * @param page Playwright Page 对象
 * @param responseText 响应文本
 */
export async function mockAIChatResponse(
  page: Page,
  responseText = 'This is a mock AI response for testing purposes.'
): Promise<void> {
  // 拦截所有聊天 API 请求
  await page.route('**/chat/completions', async (route) => {
    // 模拟流式响应
    const chunks = responseText.split('').map((char, index) => ({
      id: `chunk-${index}`,
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'test-model',
      choices: [
        {
          index: 0,
          delta: { content: char },
          finish_reason: null,
        },
      ],
    }));

    // 添加结束标记
    chunks.push({
      id: 'chunk-final',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'test-model',
      choices: [
        {
          index: 0,
          delta: { content: '' },
          finish_reason: null,
        },
      ],
    });

    // 模拟流式响应（这里简化为单次响应）
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-response',
        object: 'chat.completion',
        created: Date.now(),
        model: 'test-model',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: responseText,
            },
            finish_reason: 'stop',
          },
        ],
      }),
    });
  });
}

/**
 * 清理浏览器存储
 * 在页面上下文中清理所有存储
 * 注意：需要在页面已导航后调用，否则会因安全限制导致访问 localStorage 失败
 * @param page Playwright Page 对象
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  try {
    // 检查页面是否已导航
    const url = page.url();
    if (!url || url === 'about:blank' || url.startsWith('data:')) {
      // 如果页面还未导航，跳过清理（避免 SecurityError）
      return;
    }

    // 使用较短的 timeout，避免 IndexedDB 删除操作卡住
    await page
      .evaluate(
        async () => {
          // 清理 localStorage
          localStorage.clear();

          // 清理 sessionStorage
          sessionStorage.clear();

          // 清理 IndexedDB（添加超时保护）
          if (window.indexedDB) {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name) {
                await Promise.race([
                  new Promise<void>((resolve, reject) => {
                    const request = indexedDB.deleteDatabase(db.name as string);
                    request.addEventListener('success', () => resolve());
                    request.addEventListener('error', () => reject(request.error));
                  }),
                  // 超时保护：5 秒后跳过
                  new Promise<void>((resolve) => setTimeout(() => resolve(), 5000)),
                ]);
              }
            }
          }
        },
        { timeout: 10000 }
      )
      .catch(() => {
        // 如果 evaluate 超时或失败，忽略错误
        console.warn('清理浏览器存储超时，跳过');
      });
  } catch (error) {
    // 忽略错误，继续执行
    console.warn('清理浏览器存储时出错:', error);
  }
}

/**
 * 等待元素可见
 * @param page Playwright Page 对象
 * @param selector 元素选择器
 * @param timeout 超时时间
 */
export async function waitForElementVisible(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

/**
 * 等待元素可点击
 * @param page Playwright Page 对象
 * @param selector 元素选择器
 * @param timeout 超时时间
 */
export async function waitForElementClickable(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout });
  await expect(element).toBeEnabled({ timeout });
}

/**
 * 安全点击元素
 * 等待元素可点击后点击
 * @param page Playwright Page 对象
 * @param selector 元素选择器
 * @param timeout 超时时间
 */
export async function safeClick(
  page: Page,
  selector: string,
  timeout = 10000
): Promise<void> {
  await waitForElementClickable(page, selector, timeout);
  await page.click(selector);
}

/**
 * 安全填充输入框
 * 等待输入框可见后填充
 * @param page Playwright Page 对象
 * @param selector 输入框选择器
 * @param value 填充值
 * @param timeout 超时时间
 */
export async function safeFill(
  page: Page,
  selector: string,
  value: string,
  timeout = 10000
): Promise<void> {
  await waitForElementVisible(page, selector, timeout);
  await page.fill(selector, value);
}

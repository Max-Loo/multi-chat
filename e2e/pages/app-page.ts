/**
 * 应用级页面对象
 *
 * 封装应用级别的交互逻辑
 */

import { Page } from '@playwright/test';

export class AppPage {
  readonly page: Page;

  // 定位器
  readonly sidebar: ReturnType<Page['getByTestId']>;
  readonly mainContent: ReturnType<Page['getByTestId']>;
  readonly initializationScreen: ReturnType<Page['getByTestId']>;
  readonly errorScreen: ReturnType<Page['getByTestId']>;
  readonly loadingIndicator: ReturnType<Page['getByTestId']>;

  constructor(page: Page) {
    this.page = page;

    // 初始化定位器
    this.sidebar = page.getByTestId('sidebar');
    this.mainContent = page.getByTestId('main-content');
    this.initializationScreen = page.getByTestId('initialization-screen');
    this.errorScreen = page.getByTestId('error-screen');
    this.loadingIndicator = page.getByTestId('loading-indicator');
  }

  /**
   * 导航到应用首页
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * 等待初始化完成
   */
  async waitForInitialization(): Promise<void> {
    // 等待初始化屏幕消失或主内容出现
    try {
      await Promise.race([
        this.initializationScreen.waitFor({ state: 'hidden', timeout: 30000 }),
        this.mainContent.waitFor({ state: 'visible', timeout: 30000 }),
      ]);
    } catch {
      // 如果两者都未出现，可能直接显示主内容
      await this.mainContent.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  /**
   * 判断是否初始化完成
   */
  async isInitialized(): Promise<boolean> {
    const isVisible = await this.mainContent.isVisible().catch(() => false);
    return isVisible;
  }

  /**
   * 导航到指定页面
   * @param pagePath 页面路径
   */
  async navigateTo(pagePath: string): Promise<void> {
    await this.page.goto(pagePath);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 获取应用数据（IndexedDB）
   * @param storeName 存储名称
   * @param key 键名
   */
  async getData(storeName: string, key: string): Promise<any> {
    return await this.page.evaluate(async ({ storeName, key }) => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(storeName);
        request.addEventListener('success', () => {
          const db = request.result;
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          const getRequest = store.get(key);
          getRequest.addEventListener('success', () => resolve(getRequest.result));
          getRequest.addEventListener('error', () => reject(getRequest.error));
        });
        request.addEventListener('error', () => reject(request.error));
      });
    }, { storeName, key });
  }

  /**
   * 清理所有存储数据
   */
  async clearAllData(): Promise<void> {
    await this.page.evaluate(async () => {
      // 清理 localStorage
      localStorage.clear();

      // 清理 sessionStorage
      sessionStorage.clear();

      // 清理 IndexedDB
      if (window.indexedDB) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            await new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name as string);
              request.addEventListener('success', () => resolve());
              request.addEventListener('error', () => reject(request.error));
            });
          }
        }
      }
    });
  }
}

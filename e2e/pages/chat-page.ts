/**
 * 聊天页面对象
 *
 * 封装聊天页面的交互逻辑
 */

import { Page, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;

  // 定位器
  readonly createChatButton: ReturnType<Page['getByTestId']>;
  readonly messageInput: ReturnType<Page['getByTestId']>;
  readonly sendButton: ReturnType<Page['getByTestId']>;
  readonly chatBubbles: ReturnType<Page['getByTestId']>;
  readonly modelSelect: ReturnType<Page['getByTestId']>;
  readonly sidebar: ReturnType<Page['getByTestId']>;
  readonly mainContent: ReturnType<Page['getByTestId']>;

  constructor(page: Page) {
    this.page = page;

    // 初始化定位器
    this.createChatButton = page.getByTestId('create-chat-button');
    this.messageInput = page.getByTestId('message-input');
    this.sendButton = page.getByTestId('send-button');
    this.chatBubbles = page.getByTestId('chat-bubble');
    this.modelSelect = page.getByTestId('model-select');
    this.sidebar = page.getByTestId('sidebar');
    this.mainContent = page.getByTestId('main-content');
  }

  /**
   * 导航到聊天页面
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * 等待页面加载完成
   */
  async waitForReady(): Promise<void> {
    // 等待 React 应用挂载
    await this.page.waitForSelector('#root > div', { timeout: 10000 });

    // 等待侧边栏可见
    await this.sidebar.waitFor({ state: 'visible', timeout: 10000 });

    // 等待创建聊天按钮可见
    await this.createChatButton.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * 创建新聊天
   */
  async createNewChat(): Promise<void> {
    await this.createChatButton.click();
  }

  /**
   * 选择模型
   * @param modelName 模型名称
   */
  async selectModel(modelName: string): Promise<void> {
    // 等待模型选择器可见
    await expect(this.modelSelect).toBeVisible();

    // 点击模型选择器
    await this.modelSelect.click();

    // 选择指定的模型（根据实际UI调整）
    const modelOption = this.page.getByText(modelName);
    await expect(modelOption).toBeVisible();
    await modelOption.click();
  }

  /**
   * 发送消息
   * @param message 消息内容
   */
  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /**
   * 等待 AI 响应
   * @param timeout 超时时间
   */
  async waitForResponse(timeout = 10000): Promise<void> {
    // 等待消息气泡出现
    await this.page.waitForTimeout(1000);

    // 等待至少一个 assistant 气泡出现
    try {
      await this.page.waitForFunction(
        () => {
          const bubbles = document.querySelectorAll('[data-testid="chat-bubble"]');
          if (bubbles.length === 0) return false;
          const lastBubble = bubbles[bubbles.length - 1];
          return lastBubble.getAttribute('data-role') === 'assistant' &&
                 lastBubble.textContent?.trim().length > 0;
        },
        { timeout }
      );
    } catch {
      console.log('等待 AI 响应超时，继续执行');
    }
  }

  /**
   * 获取最后一条消息
   */
  async getLastMessage(): Promise<string> {
    const lastBubble = this.chatBubbles.last();
    return await lastBubble.textContent() || '';
  }

  /**
   * 获取消息历史
   */
  async getMessageHistory(): Promise<string[]> {
    const bubbles = await this.chatBubbles.all();
    const messages: string[] = [];

    for (const bubble of bubbles) {
      const text = await bubble.textContent();
      if (text) {
        messages.push(text);
      }
    }

    return messages;
  }

  /**
   * 获取用户消息数量
   */
  async getUserMessageCount(): Promise<number> {
    const userBubbles = this.page.locator('[data-testid="chat-bubble"][data-role="user"]');
    return await userBubbles.count();
  }

  /**
   * 获取 AI 响应数量
   */
  async getAssistantMessageCount(): Promise<number> {
    const assistantBubbles = this.page.locator('[data-testid="chat-bubble"][data-role="assistant"]');
    return await assistantBubbles.count();
  }
}

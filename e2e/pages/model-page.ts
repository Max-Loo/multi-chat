/**
 * 模型管理页面对象
 *
 * 封装模型管理页面的交互逻辑
 */

import { Page } from '@playwright/test';

export class ModelPage {
  readonly page: Page;

  // 定位器
  readonly addModelButton: ReturnType<Page['getByTestId']>;
  readonly modelNickname: ReturnType<Page['getByTestId']>;
  readonly modelApiKey: ReturnType<Page['getByTestId']>;
  readonly modelApiAddress: ReturnType<Page['getByTestId']>;
  readonly submitButton: ReturnType<Page['getByTestId']>;
  readonly modelCards: ReturnType<Page['getByTestId']>;
  readonly editButton: ReturnType<Page['getByTestId']>;
  readonly deleteButton: ReturnType<Page['getByTestId']>;

  constructor(page: Page) {
    this.page = page;

    // 初始化定位器
    this.addModelButton = page.getByTestId('add-model-button');
    this.modelNickname = page.getByTestId('model-nickname');
    this.modelApiKey = page.getByTestId('model-api-key');
    this.modelApiAddress = page.getByTestId('model-api-address');
    this.submitButton = page.getByTestId('submit-button');
    this.modelCards = page.getByTestId('model-card');
    this.editButton = page.getByTestId('edit-button');
    this.deleteButton = page.getByTestId('delete-button');
  }

  /**
   * 导航到模型管理页面
   */
  async goto(): Promise<void> {
    await this.page.goto('/model');
  }

  /**
   * 等待页面加载完成
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 点击添加模型按钮
   */
  async clickAddModel(): Promise<void> {
    await this.addModelButton.click();
  }

  /**
   * 填写模型表单
   * @param data 表单数据
   */
  async fillModelForm(data: {
    nickname: string;
    apiKey: string;
    apiAddress: string;
  }): Promise<void> {
    await this.modelNickname.fill(data.nickname);
    await this.modelApiKey.fill(data.apiKey);
    await this.modelApiAddress.fill(data.apiAddress);
  }

  /**
   * 提交表单
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * 点击编辑按钮
   * @param modelName 模型名称
   */
  async clickEditButton(modelName: string): Promise<void> {
    // 找到对应模型的编辑按钮
    const modelCard = this.page.locator(`[data-testid="model-card"]`).filter({ hasText: modelName });
    const editButton = modelCard.locator('[data-testid="edit-button"]');
    await editButton.click();
  }

  /**
   * 点击删除按钮
   * @param modelName 模型名称
   */
  async clickDeleteButton(modelName: string): Promise<void> {
    // 找到对应模型的删除按钮
    const modelCard = this.page.locator(`[data-testid="model-card"]`).filter({ hasText: modelName });
    const deleteButton = modelCard.locator('[data-testid="delete-button"]');
    await deleteButton.click();
  }

  /**
   * 验证模型存在
   * @param modelName 模型名称
   */
  async verifyModelExists(modelName: string): Promise<boolean> {
    const modelCard = this.page.locator(`[data-testid="model-card"]`).filter({ hasText: modelName });
    const count = await modelCard.count();
    return count > 0;
  }

  /**
   * 获取模型数量
   */
  async getModelCount(): Promise<number> {
    return await this.modelCards.count();
  }
}

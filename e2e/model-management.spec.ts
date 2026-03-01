import { test, expect } from '@playwright/test';
import { ModelPage } from './pages/model-page';
import { testModelFactory } from './helpers/test-data';
import { clearBrowserStorage } from './helpers/test-utils';

/**
 * 模型管理流程测试
 *
 * 测试场景：
 * - 添加新模型
 * - 编辑现有模型
 * - 删除模型（软删除）
 * - 表单验证
 * - API Key 加密存储验证
 */

test.describe('模型管理流程', () => {
  let modelPage: ModelPage;

  test.beforeEach(async ({ page }) => {
    modelPage = new ModelPage(page);
    await clearBrowserStorage(page);
    await modelPage.goto();
    await modelPage.waitForReady();
  });

  test.afterEach(async ({ page }) => {
    await clearBrowserStorage(page);
  });

  test('添加新模型 @smoke', async ({ page }) => {
    // 准备测试数据
    const testModel = testModelFactory({
      nickname: 'E2E Test Model',
      apiKey: 'sk-test-123456',
      apiAddress: 'https://api.test.com/v1',
    });

    // 点击添加模型按钮
    await modelPage.clickAddModel();

    // 填写表单
    await modelPage.fillModelForm(testModel);

    // 提交表单
    await modelPage.submitForm();

    // 等待模型列表更新
    await page.waitForTimeout(500);

    // 验证模型已添加
    await expect(modelPage.modelCards).toHaveCount(1);
  });

  test('编辑现有模型@regression', async ({ page }) => {
    // 先添加一个模型
    const testModel = testModelFactory({
      nickname: 'Original Name',
      apiKey: 'sk-original',
      apiAddress: 'https://api.original.com/v1',
    });

    await modelPage.clickAddModel();
    await modelPage.fillModelForm(testModel);
    await modelPage.submitForm();

    // 等待模型列表更新
    await page.waitForTimeout(500);

    // 点击编辑按钮
    await modelPage.clickEditButton(testModel.nickname);

    // 修改昵称
    const updatedModel = testModelFactory({
      nickname: 'Updated Name',
      apiKey: testModel.apiKey,
      apiAddress: testModel.apiAddress,
    });

    await modelPage.fillModelForm(updatedModel);
    await modelPage.submitForm();

    // 验证模型已更新
    await expect(page.getByText('Updated Name')).toBeVisible();
  });

  test('删除模型（软删除）@regression', async ({ page }) => {
    // 先添加一个模型
    const testModel = testModelFactory({
      nickname: 'Model To Delete',
      apiKey: 'sk-delete',
      apiAddress: 'https://api.delete.com/v1',
    });

    await modelPage.clickAddModel();
    await modelPage.fillModelForm(testModel);
    await modelPage.submitForm();
    await page.waitForTimeout(500);

    // 点击删除按钮
    await modelPage.clickDeleteButton(testModel.nickname);

    // 确认删除（点击确认按钮）
    await page.getByRole('button', { name: /confirm|确认/ }).click();

    // 验证模型不再出现在列表中
    await expect(page.getByText(testModel.nickname)).not.toBeVisible();
  });

  test('表单验证（空字段）@regression', async ({ page }) => {
    // 点击添加模型按钮
    await modelPage.clickAddModel();

    // 不填写任何字段，直接提交
    await modelPage.submitForm();

    // 验证显示验证错误提示
    await expect(page.getByText(/required|必填|不能为空/)).toBeVisible();
  });

  test('API Key 加密存储验证@regression', async ({ page }) => {
    const testModel = testModelFactory({
      nickname: 'Encryption Test',
      apiKey: 'sk-sensitive-key-123',
      apiAddress: 'https://api.test.com/v1',
    });

    // 添加模型
    await modelPage.clickAddModel();
    await modelPage.fillModelForm(testModel);
    await modelPage.submitForm();

    // 导航到编辑页面
    await modelPage.clickEditButton(testModel.nickname);

    // 验证 API Key 不会以明文形式显示
    // 正确的实现应该显示为空或遮蔽
    const apiKeyInput = page.getByTestId('model-api-key');
    const value = await apiKeyInput.inputValue();

    // API Key 不应该以明文显示（可能显示为空或遮蔽字符）
    expect(value).not.toBe(testModel.apiKey);
  });
});

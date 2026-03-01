# E2E 测试文档

本文档介绍如何使用 Playwright 进行端到端（E2E）测试。

## 目录

- [快速开始](#快速开始)
- [运行测试](#运行测试)
- [编写新测试](#编写新测试)
- [调试测试](#调试测试)
- [测试最佳实践](#测试最佳实践)
- [playwright-cli 使用指南](#playwright-cli-使用指南)

## 快速开始

### 前置要求

- Node.js 已安装
- 项目依赖已安装 (`pnpm install`)

### 安装 Playwright

```bash
# 安装 Playwright（已完成）
pnpm add -D @playwright/test

# 下载 Chromium 浏览器（手动运行）
npx playwright install chromium
```

**注意**：如果 Chromium 下载失败，请检查网络连接或使用代理。

## 运行测试

### 运行所有测试

```bash
pnpm test:e2e
```

### 运行冒烟测试

```bash
pnpm test:e2e:smoke
```

### 运行特定文件

```bash
pnpm test:e2e:file chat-flow.spec.ts
```

### 调试模式

```bash
pnpm test:e2e:debug
```

### 查看 UI 模式

```bash
pnpm test:e2e:ui
```

### 查看测试报告

```bash
# 运行测试
pnpm test:e2e

# 查看报告
pnpm test:e2e:report
```

## 编写新测试

### 使用模板

1. 复制 `e2e/templates/test.template.ts`
2. 根据需要修改测试逻辑
3. 保存为 `e2e/your-test.spec.ts`

### 使用页面对象模型

```typescript
import { test } from '@playwright/test';
import { ChatPage } from './pages/chat-page';

test('示例测试', async ({ page }) => {
  const chatPage = new ChatPage(page);

  await chatPage.goto();
  await chatPage.waitForReady();
  await chatPage.createNewChat();
  await chatPage.sendMessage('Hello');
  await chatPage.waitForResponse();
});
```

### 使用测试辅助工具

```typescript
import { mockRemoteAPI, mockAIChatResponse, clearBrowserStorage } from './helpers/test-utils';

test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
  await mockRemoteAPI(page);
  await mockAIChatResponse(page);
});
```

## 调试测试

### 使用 Playwright Inspector

```bash
pnpm test:e2e:debug
```

这会打开 Playwright Inspector，允许你：
- 单步执行测试
- 查看页面状态
- 检查元素定位器
- 查看网络请求

### 查看测试失败信息

测试失败时，Playwright 会自动：
- 截图（保存到 `test-results/`）
- 录制视频
- 保存 trace 文件

查看 trace：

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### 使用 playwright-cli 探索（可选）

playwright-cli 是一个可选的辅助工具，用于探索页面结构。

**基础命令**：

```bash
# 打开页面
playwright-cli open http://localhost:1420

# 导航
playwright-cli goto /model

# 查看快照
playwright-cli snapshot

# 点击元素
playwright-cli click [data-testid="button"]

# 填充输入框
playwright-cli fill [data-testid="input"] "text"
```

**何时使用**：
- ✅ 探索未知页面结构
- ✅ 验证选择器是否正确
- ✅ 调试失败的测试步骤

**不适用场景**：
- ❌ 自动化代码生成（无 test-gen 命令）
- ❌ 批量测试运行
- ❌ CI/CD 集成

## 测试最佳实践

### 1. 使用页面对象模型

✅ **推荐**：

```typescript
const chatPage = new ChatPage(page);
await chatPage.sendMessage('Hello');
```

❌ **避免**：

```typescript
await page.fill('[data-testid="message-input"]', 'Hello');
await page.click('[data-testid="send-button"]');
```

### 2. 使用稳定的定位器

优先级：
1. `data-testid`（最稳定）
2. `getByRole`（可访问性）
3. `getByText`（语义化）
4. CSS selector（最后手段）

✅ **推荐**：

```typescript
await page.click('[data-testid="send-button"]');
await page.getByRole('button', { name: '发送' }).click();
```

❌ **避免**：

```typescript
await page.click('.ant-btn-primary.ant-btn-icon-only');
```

### 3. 避免硬编码等待

✅ **推荐**：

```typescript
await expect(page.locator('[data-testid="message"]')).toBeVisible();
```

❌ **避免**：

```typescript
await page.waitForTimeout(5000); // 硬编码等待
```

### 4. 测试数据隔离

每个测试应该使用独立的测试数据：

```typescript
test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
});
```

### 5. 使用测试标签

```typescript
test('核心功能测试 @smoke', async ({ page }) => {
  // 测试代码
});

test('完整功能测试 @regression', async ({ page }) => {
  // 测试代码
});
```

## playwright-cli 使用指南

### 安装

playwright-cli 已全局安装（版本 1.59.0-alpha-1771104257000）

验证安装：

```bash
playwright-cli --version
```

### 交互式探索

1. **打开页面**：

```bash
playwright-cli open http://localhost:1420
```

2. **执行操作**：

```bash
# 导航
playwright-cli goto /model

# 点击
playwright-cli click [data-testid="add-model-button"]

# 填充
playwright-cli fill [data-testid="model-nickname"] "Test Model"

# 查看快照
playwright-cli snapshot --filename=model-page.yml
```

3. **保存快照**：

```bash
playwright-cli snapshot --filename=test-page.yml
```

### 结合 AI Agent 使用

1. 使用 playwright-cli 探索页面
2. 保存快照信息
3. 将快照提供给 AI Agent
4. AI Agent 基于快照生成测试代码

**示例**：

```markdown
我使用 playwright-cli 探索了页面，发现以下元素：

### 快照信息
```yaml
- 创建聊天按钮: ref=e15, text="新建聊天"
- 消息输入框: ref=e5, placeholder="输入消息"
- 发送按钮: ref=e8, text="发送"
```

请基于这些信息生成测试代码。
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `open <url>` | 打开页面 |
| `goto <path>` | 导航到路径 |
| `click <selector>` | 点击元素 |
| `fill <selector> <text>` | 填充输入框 |
| `snapshot` | 查看页面快照 |
| `screenshot` | 截图 |
| `exit` | 退出 |

## 项目结构

```
e2e/
├── chat-flow.spec.ts          # 聊天流程测试
├── example.spec.ts            # 基础设施验证测试
├── helpers/
│   ├── test-data.ts           # 测试数据工厂
│   └── test-utils.ts          # 测试辅助函数
├── pages/
│   ├── chat-page.ts           # 聊天页面对象
│   ├── model-page.ts          # 模型管理页面对象
│   └── app-page.ts            # 应用级页面对象
├── templates/
│   ├── test.template.ts       # 测试代码模板
│   ├── page-object.template.ts # 页面对象模板
│   └── ai-prompts/            # AI 辅助生成 Prompt 模板
└── examples/
    └── simple-flow.example.ts # 简单测试示例
```

## 故障排除

### 测试超时

如果测试超时，可以：

1. 增加超时时间（`playwright.config.ts`）
2. 检查网络请求是否完成
3. 验证元素定位器是否正确

### 元素未找到

1. 确认元素已添加 `data-testid`
2. 使用 playwright-cli 验证选择器
3. 增加等待时间

### 测试不稳定

1. 检查是否有竞态条件
2. 增加重试次数（`retries: 2`）
3. 使用更稳定的定位器

## 更多资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [页面对象模型模式](https://www.selenium.dev/documentation/test-practices/bem/page-object-model/)

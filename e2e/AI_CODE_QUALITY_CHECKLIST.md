# AI 生成代码质量 Checklist

本文档提供评估 AI 生成的 E2E 测试代码质量的检查清单。

## 使用场景

本 Checklist 适用于以下场景：
- 使用 AI Agent（如 opencode）生成测试代码
- 使用 AI 编程助手生成测试片段
- 使用 playwright-cli + AI 生成测试
- 审查 AI 生成的测试代码

---

## 1. 代码结构质量

### 1.1 测试组织
- [ ] 测试使用 `test.describe()` 正确分组
- [ ] 测试描述清晰、具体
- [ ] 测试逻辑清晰、易于理解
- [ ] 测试独立，无相互依赖

### 1.2 代码可读性
- [ ] 变量命名语义化
- [ ] 避免魔法数字和硬编码值
- [ ] 代码格式统一
- [ ] 适当添加注释

**示例**：

✅ **好的代码**：
```typescript
const testMessage = 'Hello, this is a test message';
await chatPage.sendMessage(testMessage);
```

❌ **差的代码**：
```typescript
await chatPage.sendMessage('test'); // 硬编码字符串
```

---

## 2. 技术要求符合度

### 2.1 页面对象模型
- [ ] 使用页面对象封装页面交互
- [ ] 不直接在测试中操作 `page` 对象
- [ ] 页面对象方法语义清晰

**AI 常见错误**：
```typescript
// ❌ AI 直接操作 page 对象
await page.fill('[data-testid="message-input"]', 'Hello');
await page.click('[data-testid="send-button"]');

// ✅ 应该使用页面对象
const chatPage = new ChatPage(page);
await chatPage.sendMessage('Hello');
```

### 2.2 定位器稳定性
- [ ] 优先使用 `data-testid` 定位器
- [ ] 不使用 CSS 类名
- [ ] 不使用 XPath（除非必要）

**AI 常见错误**：
```typescript
// ❌ AI 使用 CSS 类名
await page.click('.ant-btn-primary');

// ❌ AI 使用 XPath
await page.click('//button[@class="ant-btn"]');

// ✅ 应该使用 data-testid
await page.click('[data-testid="send-button"]');
```

### 2.3 等待策略
- [ ] 使用条件等待（`expect().toBeVisible()`）
- [ ] 避免硬编码等待（`waitForTimeout()`）
- [ ] 使用 `waitForLoadState('networkidle')` 等待网络

**AI 常见错误**：
```typescript
// ❌ AI 添加硬编码等待
await page.waitForTimeout(5000);

// ✅ 应该使用条件等待
await expect(page.getByTestId('message')).toBeVisible();
await page.waitForLoadState('networkidle');
```

---

## 3. 测试数据管理

### 3.1 测试数据隔离
- [ ] 使用工厂函数生成测试数据
- [ ] 测试数据使用唯一标识符
- [ ] 测试后清理测试数据

**AI 常见错误**：
```typescript
// ❌ AI 使用固定数据
const model = {
  nickname: 'Test Model',
  apiKey: 'sk-test',
};

// ✅ 应该使用工厂函数
const model = testModelFactory({
  nickname: 'E2E Test Model',
  apiKey: 'sk-test-123',
});
```

### 3.2 数据清理
- [ ] 使用 `beforeEach` 清理数据
- [ ] 使用 `afterEach` 清理数据
- [ ] 不污染其他测试的数据

**示例**：
```typescript
test.beforeEach(async ({ page }) => {
  await clearBrowserStorage(page);
});

test.afterEach(async ({ page }) => {
  await clearBrowserStorage(page);
});
```

---

## 4. 错误处理和边界情况

### 4.1 异常处理
- [ ] 测试考虑网络失败场景
- [ ] 测试考虑 API 错误响应
- [ ] 测试考虑用户输入错误

**AI 常见遗漏**：
- ❌ 只测试正常流程，忽略错误场景
- ✅ 应该测试表单验证、错误提示等

### 4.2 超时处理
- [ ] 设置合理的超时时间
- [ ] 处理元素加载慢的情况
- [ ] 使用重试机制（`retries: 2`）

---

## 5. 测试标签和组织

### 5.1 测试标签
- [ ] 核心功能标记 `@smoke`
- [ ] 回归测试标记 `@regression`
- [ ] 慢速测试标记 `@slow`

**示例**：
```typescript
test('创建新聊天 @smoke', async ({ page }) => {
  // 核心流程
});

test('验证流式响应 @regression', async ({ page }) => {
  // 完整回归测试
});
```

### 5.2 测试描述
- [ ] 描述说明测试目的
- [ ] 描述说明测试场景
- [ ] 描述使用清晰的语言

---

## 6. AI Prompt 质量检查

### 6.1 上下文信息
Prompt 是否包含：
- [ ] 项目结构说明
- [ ] 技术栈信息（React, TypeScript, Playwright）
- [ ] 测试场景描述
- [ ] 约束条件（定位器类型、页面对象要求）

**好的 Prompt 示例**：
```markdown
请为以下场景生成 Playwright E2E 测试代码：

**项目结构**：
- 前端：React + TypeScript
- 测试框架：Playwright
- 页面对象：ChatPage, ModelPage

**测试场景**：
1. 用户点击"创建新聊天"按钮
2. 用户选择模型
3. 用户输入消息
4. 用户点击发送
5. 验证消息显示

**约束条件**：
- 必须使用页面对象模型
- 使用 data-testid 定位器
- 使用工厂函数生成测试数据
- 避免硬编码等待
```

### 6.2 示例代码
Prompt 是否提供：
- [ ] 页面对象使用示例
- [ ] 测试结构示例
- [ ] 断言示例

---

## 7. 代码审查优先级

### 🔴 高优先级（必须修复）
- 使用 CSS 类名定位器
- 直接操作 `page` 对象（不使用页面对象）
- 硬编码等待时间
- 测试数据未隔离

### 🟡 中优先级（建议修复）
- 测试描述不清晰
- 缺少测试标签
- 变量命名不规范
- 缺少错误场景测试

### 🟢 低优先级（可选优化）
- 代码格式问题
- 注释不足
- 测试覆盖边缘情况

---

## 8. AI 代码质量评分

### 评分标准

| 分数 | 等级 | 描述 |
|------|------|------|
| 90-100 | 优秀 | 完全符合所有要求，可直接使用 |
| 75-89 | 良好 | 基本符合要求，需要小幅修改 |
| 60-74 | 及格 | 部分符合要求，需要中等修改 |
| < 60 | 不及格 | 不符合要求，需要大量修改或重新生成 |

### 评分维度

1. **代码结构**（20 分）
   - 测试组织（10 分）
   - 代码可读性（10 分）

2. **技术要求**（30 分）
   - 页面对象模型（10 分）
   - 定位器稳定性（10 分）
   - 等待策略（10 分）

3. **测试数据**（20 分）
   - 数据隔离（10 分）
   - 数据清理（10 分）

4. **错误处理**（15 分）
   - 异常处理（10 分）
   - 超时处理（5 分）

5. **测试组织**（15 分）
   - 测试标签（5 分）
   - 测试描述（10 分）

---

## 9. 快速检查清单

### AI 生成代码 5 分钟检查

1. **检查定位器**（1 分钟）
   - 搜索 `.locator(` 和 CSS 选择器
   - 确保使用 `data-testid`

2. **检查页面对象**（1 分钟）
   - 搜索 `page.click`, `page.fill`
   - 确保使用页面对象方法

3. **检查等待**（1 分钟）
   - 搜索 `waitForTimeout`
   - 确保使用条件等待

4. **检查测试数据**（1 分钟）
   - 确保使用工厂函数
   - 确保数据清理

5. **检查测试标签**（1 分钟）
   - 确保核心测试有 `@smoke`
   - 确保回归测试有 `@regression`

---

## 10. 常见问题和解决方案

### 问题 1：AI 使用 CSS 类名
**解决方案**：
```typescript
// 替换前
await page.click('.ant-btn');

// 替换后
await page.click('[data-testid="submit-button"]');
```

### 问题 2：AI 不使用页面对象
**解决方案**：
```typescript
// 替换前
await page.fill('[data-testid="message-input"]', 'Hello');

// 替换后
const chatPage = new ChatPage(page);
await chatPage.sendMessage('Hello');
```

### 问题 3：AI 添加硬编码等待
**解决方案**：
```typescript
// 替换前
await page.waitForTimeout(5000);

// 替换后
await expect(page.getByTestId('result')).toBeVisible();
```

### 问题 4：AI 使用固定测试数据
**解决方案**：
```typescript
// 替换前
const model = { name: 'Test', key: 'sk-test' };

// 替换后
const model = testModelFactory({
  nickname: 'E2E Test Model',
  apiKey: 'sk-test-123',
});
```

---

## 11. 渐进式信任策略

### 阶段 1：低信任（初期）
- ✅ 完整审查所有 AI 生成的代码
- ✅ 运行所有测试验证功能
- ✅ 手动优化关键测试
- 🎯 目标：建立 AI 代码质量基线

### 阶段 2：中等信任（中期）
- ✅ 重点审查关键部分
- ✅ 抽查 AI 生成的代码
- ✅ 自动化检查覆盖大部分问题
- 🎯 目标：提高审查效率

### 阶段 3：高信任（后期）
- ✅ 仅审查高风险代码
- ✅ 依赖自动化检查
- ✅ AI 生成大部分测试代码
- 🎯 目标：最大化 AI 辅助价值

---

## 12. 参考资料

- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [AI 辅助测试生成指南](./AI-TESTING-GUIDE.md)
- [E2E 测试代码审查清单](./CODE_REVIEW_CHECKLIST.md)
- [测试编写文档](./README.md)

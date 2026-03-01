# E2E 测试代码审查清单

本文档提供 E2E 测试代码审查的检查清单，确保测试质量和可维护性。

## 基础检查

### 测试结构
- [ ] 测试文件位于 `e2e/` 目录
- [ ] 测试文件命名遵循 `*.spec.ts` 格式
- [ ] 测试使用 `test.describe()` 分组
- [ ] 测试描述清晰、具体，说明测试场景

### 测试独立性
- [ ] 每个测试可以独立运行
- [ ] 测试之间无依赖关系
- [ ] 使用 `beforeEach` 和 `afterEach` 清理测试数据
- [ ] 使用 `clearBrowserStorage()` 或 `setupTestData()` 确保数据隔离

## 代码质量

### 页面对象模型使用
- [ ] 使用页面对象封装页面交互
- [ ] 避免直接在测试中操作 `page` 对象
- [ ] 页面对象方法职责单一、语义清晰

**示例**：

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

### 定位器稳定性
- [ ] 优先使用 `data-testid` 定位器
- [ ] 其次使用 `getByRole()`（可访问性）
- [ ] 再次使用 `getByText()`（语义化）
- [ ] 避免使用 CSS 类名（不稳定）

**优先级**：
1. `page.getByTestId('element-id')` - 最稳定
2. `page.getByRole('button', { name: '提交' })` - 可访问
3. `page.getByText('提交')` - 语义化
4. `page.locator('.ant-btn')` - 避免使用

### 等待策略
- [ ] 使用 `expect().toBeVisible()` 等待元素
- [ ] 使用 `waitForLoadState('networkidle')` 等待网络
- [ ] 避免使用 `waitForTimeout()` 硬编码延迟

**示例**：

✅ **推荐**：
```typescript
await expect(page.getByTestId('message')).toBeVisible();
await page.waitForLoadState('networkidle');
```

❌ **避免**：
```typescript
await page.waitForTimeout(5000); // 硬编码等待
```

### 测试数据管理
- [ ] 使用工厂函数生成测试数据（`testModelFactory`）
- [ ] 测试数据使用唯一标识符（避免冲突）
- [ ] 测试完成后清理测试数据

**示例**：
```typescript
const testModel = testModelFactory({
  nickname: 'E2E Test Model',
  apiKey: 'sk-test-123',
});
```

### 测试标签
- [ ] 核心功能测试标记 `@smoke`
- [ ] 回归测试标记 `@regression`
- [ ] 跳过暂时无法运行的测试使用 `test.skip()`

**示例**：
```typescript
test('核心功能 @smoke', async ({ page }) => {
  // 核心流程测试
});

test('边缘场景 @regression', async ({ page }) => {
  // 完整回归测试
});
```

## AI 生成代码审查

### 代码生成质量检查
如果测试代码由 AI 生成，额外检查以下内容：

- [ ] AI 生成的定位器是否正确
- [ ] AI 是否使用了页面对象模型
- [ ] AI 是否添加了必要的等待逻辑
- [ ] AI 生成的测试数据是否合理
- [ ] AI 是否处理了边界情况和错误

**AI 生成常见问题**：

1. **使用 CSS 类名定位**：AI 可能生成 `.class-selector`
   - **审查要点**：替换为 `data-testid`

2. **硬编码等待时间**：AI 可能添加 `waitForTimeout(5000)`
   - **审查要点**：替换为条件等待

3. **缺少页面对象封装**：AI 直接操作 `page` 对象
   - **审查要点**：使用页面对象方法

4. **测试数据不隔离**：AI 使用固定值
   - **审查要点**：使用工厂函数生成唯一数据

5. **缺少错误处理**：AI 假设一切正常
   - **审查要点**：添加异常场景测试

### AI Prompt 质量检查

如果使用 AI 生成测试，检查 Prompt 是否包含：

- [ ] 上下文信息（项目结构、技术栈）
- [ ] 测试场景描述（用户行为、预期结果）
- [ ] 约束条件（定位器类型、页面对象要求）
- [ ] 示例代码（参考模板）

## 可维护性检查

### 代码可读性
- [ ] 测试逻辑清晰易懂
- [ ] 变量命名语义化
- [ ] 添加必要的注释（说明复杂逻辑）
- [ ] 避免过度嵌套

### 测试稳定性
- [ ] 测试在多次运行中结果一致
- [ ] 测试不依赖外部环境（网络、服务器）
- [ ] 使用 Mock 隔离外部依赖
- [ ] 测试超时时间合理（30s 默认）

### 测试执行速度
- [ ] 单个测试执行时间 < 30 秒
- [ ] 冒烟测试套件 < 1 分钟
- [ ] 避免不必要的等待和延迟

## 安全性检查

### 敏感信息处理
- [ ] 测试代码不包含真实 API Key
- [ ] 测试不暴露用户数据
- [ ] 测试数据库使用独立命名空间

### 权限和访问控制
- [ ] 测试使用独立的测试环境
- [ ] 测试不影响生产数据
- [ ] 测试清理临时数据

## 文档和注释

### 测试文档
- [ ] 复杂测试添加注释说明意图
- [ ] 页面对象方法添加 JSDoc 注释
- [ ] 测试套件添加描述说明目的

### 代码示例
- [ ] 提供测试运行示例
- [ ] 提供常见问题解决方案
- [ ] 提供页面对象使用示例

## 审查流程

1. **自动检查**：运行 `pnpm lint` 和 `pnpm tsc` 确保代码质量
2. **本地验证**：运行 `pnpm test:e2e` 确保测试通过
3. **同行审查**：使用本清单逐项检查
4. **AI 辅助审查**：如果代码由 AI 生成，执行 AI 生成代码审查部分
5. **反馈修正**：记录问题并要求作者修正

## 快速参考

### 关键指标
- **测试通过率**: 100%
- **测试覆盖率**: 至少覆盖 3 个核心流程
- **测试执行时间**: 冒烟测试 < 1 分钟
- **代码重复率**: < 10%

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 测试不稳定 | 使用稳定的定位器和等待策略 |
| 测试太慢 | 减少硬编码等待，优化网络 Mock |
| 测试失败 | 检查元素定位器、等待时间、测试数据 |
| AI 代码质量差 | 使用 AI 生成代码审查清单 |

## 参考资料

- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [页面对象模型模式](https://www.selenium.dev/documentation/test-practices/bem/page-object-model/)
- [测试驱动开发](https://en.wikipedia.org/wiki/Test-driven_development)

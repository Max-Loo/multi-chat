# Spec: 行为驱动测试实践

## Purpose

定义行为驱动测试（BDD）的最佳实践，确保测试关注用户可见行为而非内部实现细节，提高测试的稳定性和可维护性。

## Requirements

### Requirement: 测试必须关注用户可见行为

系统 SHALL 确保所有测试关注用户可见行为，而非内部实现细节。

**核心原则**：
- 测试应该模拟真实用户操作（点击、输入、导航）
- 测试应该验证用户可见结果（UI 渲染、数据展示、用户体验）
- 测试应该在重构时保持稳定，不因内部实现变化而失败
- 外部依赖（如 API 调用）应使用 MSW 模拟，而非 vi.mock（集成测试）

**单元测试 vs 集成测试的 BDD 实践**：

| 维度 | 单元测试 | 集成测试 |
|-----|---------|---------|
| **关注点** | 函数/类的行为（输入 → 输出） | 用户可见的流程（操作 → 结果） |
| **测试对象** | 单个模块（函数、组件、Hook） | 多模块协作（UI + Redux + API） |
| **Mock 策略** | 使用 `vi.mock` 隔离所有依赖 | 使用 MSW 模拟外部 API |
| **验证内容** | 输入输出、逻辑分支 | UI 渲染、状态更新、用户体验 |
| **重构稳定性** | 高（只要函数签名不变） | 高（只要用户行为不变） |
| **示例** | `chatService.test.ts` | `chat-flow.integration.test.ts` |

#### Scenario: 单元测试关注函数行为
- **WHEN** 编写单元测试（如工具函数、Redux reducer、Hook）
- **THEN** 测试 SHALL 关注输入 → 输出的映射关系
- **AND** 测试 SHALL 使用 `vi.mock` 隔离所有依赖
- **AND** 测试 SHALL NOT 测试内部函数调用次数或顺序
- **AND** 测试 SHALL NOT 测试内部状态管理细节

**示例**：
```typescript
// ✅ 正确：测试函数行为
test('应该加密敏感数据 当传入明文和密钥', () => {
  const plaintext = 'my-api-key';
  const masterKey = 'a'.repeat(64);
  const encrypted = encryptField(plaintext, masterKey);
  expect(encrypted).toMatch(/^enc:/);
});

// ❌ 错误：测试内部实现
test('应该调用 crypto.subtle.encrypt 一次', () => {
  const spy = vi.spyOn(crypto.subtle, 'encrypt');
  encryptField('text', 'key');
  expect(spy).toHaveBeenCalledTimes(1); // 测试内部实现细节
});
```

#### Scenario: 集成测试关注用户流程
- **WHEN** 编写集成测试（如聊天流程、模型管理）
- **THEN** 测试 SHALL 关注用户操作 → 可见结果的流程
- **AND** 测试 SHALL 使用 MSW 模拟外部 API
- **AND** 测试 SHALL 验证 UI 渲染、状态更新、用户反馈
- **AND** 测试 SHALL NOT 使用 `vi.mock` 隔离被测试系统的内部模块

**示例**：
```typescript
// ✅ 正确：测试用户流程
test('应该显示流式响应 当用户发送消息', async () => {
  server.use(
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.stream(...);
    })
  );
  render(<ChatPage />);
  await userEvent.type(screen.getByRole('textbox'), '你好');
  await userEvent.click(screen.getByRole('button', { name: '发送' }));
  await waitFor(() => expect(screen.getByText('你好！')).toBeInTheDocument());
});

// ❌ 错误：测试模块间调用
test('应该调用 chatService.streamChatCompletion', async () => {
  vi.mocked(chatService.streamChatCompletion).mockResolvedValue(...);
  // 测试内部模块调用，而非用户可见行为
});
```

#### Scenario: 组件测试测试用户交互而非内部实现
- **WHEN** 编写组件测试时
- **THEN** 测试 SHALL 模拟用户交互（如点击按钮、输入文本）
- **AND** 测试 SHALL 验证可见结果（如文本内容、UI 状态）
- **AND** 测试 SHALL NOT Mock 子组件
- **AND** 测试 SHALL NOT 测试内部方法调用

#### Scenario: Hooks 测试测试行为结果而非内部实现
- **WHEN** 编写 Hooks 测试时
- **THEN** 测试 SHALL 验证 Hook 返回值的行为
- **AND** 测试 SHALL NOT 测试内部函数调用（如 `clearTimeout` 调用次数）
- **AND** 测试 SHALL NOT 测试内部状态管理细节

#### Scenario: Redux 测试测试完整行为而非状态转换
- **WHEN** 编写 Redux 测试时
- **THEN** 测试 SHALL 验证用户可见的最终状态
- **AND** 测试 SHALL NOT 测试中间状态转换（如 `pending` → `fulfilled`）
- **AND** 测试 SHALL 更多依赖集成测试验证 Redux 行为

#### Scenario: API 调用测试根据类型选择 Mock 策略
- **WHEN** 测试涉及 API 调用的功能
- **THEN** 单元测试 SHALL 使用 `vi.mock` 模拟 SDK 或 fetch 函数
- **AND** 集成测试 SHALL 使用 MSW 模拟 HTTP 请求
- **AND** 测试 SHALL 验证用户可见的行为（如 UI 更新、错误提示）

**单元测试示例**：
```typescript
// ✅ 正确：单元测试关注函数行为
vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => ({ provider: 'deepseek' }))
}));

test('应该转换消息格式 当调用 streamChatCompletion', () => {
  const messages = [/* ... */];
  const result = streamChatCompletion(messages);
  expect(result).toEqual(/* 期望的消息格式 */);
});
```

**集成测试示例**：
```typescript
// ✅ 正确：集成测试关注用户流程
test('应该显示流式响应 当用户发送消息', async () => {
  server.use(
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.stream(...);
    })
  );
  render(<ChatPage />);
  await userEvent.type(screen.getByRole('textbox'), '你好');
  await userEvent.click(screen.getByRole('button', { name: '发送' }));
  await waitFor(() => expect(screen.getByText('你好！')).toBeInTheDocument());
});
```

### Requirement: 测试在重构时保持稳定
- **WHEN** 编写 Redux 测试时
- **THEN** 测试 SHALL 验证用户可见的最终状态
- **AND** 测试 SHALL NOT 测试中间状态转换（如 `pending` → `fulfilled`）
- **AND** 测试 SHALL 更多依赖集成测试验证 Redux 行为

### Requirement: 测试在重构时保持稳定

系统 SHALL 确保测试在代码重构时保持稳定，不因内部实现变化而失败。

**判断标准**：
- 如果重命名函数、移动文件、改变内部实现，测试是否仍然通过？
- 如果答案是"否"，则测试可能过度关注实现细节
- MSW handlers 的变更不应影响测试

#### Scenario: 组件重构不导致测试失败
- **WHEN** 重构组件内部实现（如拆分组件、提取逻辑）
- **THEN** 测试 SHALL 继续通过
- **AND** 测试 SHALL NOT 需要修改

#### Scenario: 工具函数重构不导致测试失败
- **WHEN** 重构工具函数内部实现（如改变算法）
- **THEN** 测试 SHALL 继续通过
- **AND** 测试 SHALL NOT 需要修改

#### Scenario: API 调用方式重构不导致测试失败
- **WHEN** 重构 API 调用方式（如从 fetch 改为 axios，或改变 URL）
- **THEN** 使用 MSW 的测试 SHALL 继续通过
- **AND** 测试 SHALL NOT 需要修改 MSW handlers（只要 API 签名不变）
- **AND** 测试 SHALL 继续验证用户可见行为

### Requirement: 测试命名清晰描述行为

系统 SHALL 确保所有测试用例使用统一的命名规范，清晰描述被测试的行为。

**命名规范**：
- 格式："应该 [预期行为] 当 [条件]"
- 使用中文描述
- 预期行为：用户可见的结果
- 条件：触发行为的条件
- API 相关测试应描述用户视角的行为，而非技术细节

#### Scenario: 组件测试命名示例
- **WHEN** 编写组件测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该渲染错误消息 当 API 请求失败"

#### Scenario: Hooks 测试命名示例
- **WHEN** 编写 Hooks 测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该延迟更新值 当输入值变化"

#### Scenario: 集成测试命名示例
- **WHEN** 编写集成测试时
- **THEN** 测试名称 SHALL 使用规范格式
- **示例**："应该完成完整聊天流程 当用户发送消息"

#### Scenario: API 相关测试命名示例
- **WHEN** 编写涉及 API 调用的测试
- **THEN** 测试名称 SHALL 聚焦于用户可见的行为
- **AND** 测试名称 SHALL NOT 包含技术细节（如 "应该使用 POST 方法"）
- **示例**：
  - ✅ "应该显示错误提示 当网络请求失败"
  - ❌ "应该调用 POST API 当用户点击发送按钮"

### Requirement: 测试目录结构按功能组织

系统 SHALL 确保测试目录结构按功能/行为组织，而非机械照搬源代码结构。

**目录结构原则**：
- 按功能领域组织（如 `chat-management.test.ts`）
- 按用户场景组织（如 `user-authentication.test.ts`）
- 简单组件/工具可保留按文件组织
- MSW handlers 集中管理在 `src/__test__/msw/handlers/` 目录

#### Scenario: 功能测试文件命名
- **WHEN** 创建功能测试时
- **THEN** 测试文件名 SHALL 反映功能领域
- **示例**: `chat-management.test.ts`、`model-management.test.ts`

#### Scenario: 组件测试文件命名
- **WHEN** 组件足够简单（如 `Button`）
- **THEN** 测试文件名 CAN 按组件命名
- **示例**: `Button.test.tsx`

#### Scenario: 避免机械照搬源代码结构
- **WHEN** 组织测试文件时
- **THEN** 测试目录结构 SHALL NOT 机械照搬 `src/` 目录
- **AND** 测试 SHALL 按功能组织，而非文件结构

#### Scenario: MSW Handlers 按供应商或功能组织
- **WHEN** 组织 MSW handlers
- **THEN** handlers SHALL 按供应商（如 `deepseek.ts`）或功能模块组织
- **AND** handlers SHALL 放置在 `src/__test__/msw/handlers/` 目录
- **AND** 测试文件 SHALL 从 `@/__test__/msw/handlers` 导入所需的 handlers

**目录结构示例**：
```
src/__test__/
├── msw/
│   ├── handlers/
│   │   ├── deepseek.ts       # DeepSeek API handlers
│   │   ├── kimi.ts           # Moonshot AI handlers
│   │   ├── zhipu.ts          # ZhipuAI handlers
│   │   ├── models-dev.ts     # models.dev API handlers
│   │   └── index.ts          # 统一导出
│   └── setup.ts              # MSW server 配置
├── integration/
│   ├── chat-flow.test.ts
│   └── model-management.test.ts
└── ...
```

### Requirement: MSW 必须支持行为驱动的测试场景

系统 SHALL 确保 MSW 的集成支持行为驱动测试的核心理念，测试应验证用户可见行为而非技术细节。

**MSW 与 BDD 的结合点**：
- MSW 模拟外部 API，测试聚焦于 UI 和用户交互
- Handlers 的参数化支持不同场景（成功、失败、超时）
- 流式响应模拟支持实时 UI 更新测试

#### Scenario: MSW Handlers 支持用户场景模拟
- **WHEN** 测试不同的用户场景（如网络错误、API 超时）
- **THEN** MSW handlers SHALL 支持参数化配置
- **AND** 测试 SHALL 通过 handler 参数描述场景（如 `{ status: 500, delay: 5000 }`）
- **AND** 测试 SHALL 验证用户可见的反馈（如错误提示、加载状态）

**示例**：
```typescript
// 场景 1: 正常流程
server.use(
  deepSeekHandlers.success({ response: { ... } })
);
// 验证：用户看到流式响应

// 场景 2: 网络错误
server.use(
  deepSeekHandlers.networkError()
);
// 验证：用户看到错误提示 Toast

// 场景 3: API 超时
server.use(
  deepSeekHandlers.timeout({ delay: 30000 })
);
// 验证：用户看到超时提示
```

#### Scenario: 流式响应测试支持实时 UI 更新验证
- **WHEN** 测试包含流式响应的功能（如 DeepSeek-R1 推理内容）
- **THEN** MSW handlers SHALL 支持模拟流式数据
- **AND** 测试 SHALL 验证 UI 的实时更新（如逐字显示、推理内容折叠）
- **AND** 测试 SHALL NOT 测试内部流处理逻辑（如 `ReadableStream` 的读取方法）
## Context

**当前状态**
- `src/services/chatService.ts` 是应用的核心模块，负责处理所有 AI 聊天请求
- 当前测试覆盖率 0%，测试文件仅验证函数能否导入，不测试实际逻辑
- chatService 包含三个核心函数：
  - `getProvider()`: 工厂函数，根据供应商类型创建对应的 provider
  - `buildMessages()`: 纯函数，将应用消息格式转换为 Vercel AI SDK 格式
  - `streamChatCompletion()`: 异步生成器函数，发起流式聊天请求

**技术栈**
- Vitest：测试框架
- Vercel AI SDK：用于流式 AI 响应
- TypeScript：类型系统

**约束条件**
- 不能修改 chatService 的公共 API
- 不能改变现有业务逻辑
- 测试必须快速执行（单元测试级别）
- 必须使用项目现有的测试辅助工具（`@/test-helpers`）

**利益相关者**
- 开发团队：需要可靠的测试保护以支持重构和功能迭代
- 用户：间接受益于更稳定的聊天功能

---

## Goals / Non-Goals

**Goals:**
- 为 chatService 模块的三个核心函数提供完整的单元测试覆盖
- 达到 90%+ 语句覆盖率、80%+ 分支覆盖率、100% 函数覆盖率
- 测试应快速执行（总运行时间 < 2 秒）
- 测试应易于维护，Mock 策略清晰
- 提供测试用例作为函数使用示例

**Non-Goals:**
- 不修改 chatService.ts 的实现（除非为了提升可测试性）
- 不添加 E2E 测试或集成测试（仅单元测试）
- 不改变 Vercel AI SDK 的使用方式
- 不添加新的依赖库（使用现有的 Vitest 和 Mock 功能）

---

## Decisions

### 1. 测试文件结构

**决策**：按函数分组组织测试用例

```typescript
describe('chatService', () => {
  describe('getProvider', () => {
    // 测试 getProvider() 函数
  });

  describe('buildMessages', () => {
    // 测试 buildMessages() 函数
  });

  describe('streamChatCompletion', () => {
    // 测试 streamChatCompletion() 函数
  });
});
```

**理由**：
- 按函数分组清晰明了，易于查找
- 符合 Vitest 最佳实践
- 便于按函数查看覆盖率

**替代方案**：按功能场景分组（如"供应商选择"、"消息转换"、"流式请求"）
- **不采用原因**：chatService 的函数职责明确，按函数分组更直观

---

### 2. Mock 策略

**决策**：使用 Vitest 的 `vi.mock()` 进行模块级 Mock

```typescript
// Mock Vercel AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
  generateId: vi.fn(() => 'mock-id'),
}));

// Mock 供应商 SDK
vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => vi.fn()),
}));
```

**理由**：
- 模块级 Mock 隔离彻底，避免真实 HTTP 请求
- Vitest 原生支持，无需额外依赖
- 可以精确控制返回值和行为

**替代方案 1**：使用手动依赖注入
- **不采用原因**：需要修改 chatService 函数签名，违反"不修改 API"的约束

**替代方案 2**：使用 MSW (Mock Service Worker)
- **不采用原因**：更适合集成测试，单元测试过于重量级

---

### 3. buildMessages() 测试策略

**决策**：作为纯函数重点测试，覆盖所有消息类型和边界情况

**测试场景优先级**：
1. **核心场景**（必须覆盖）：
   - system 消息转换
   - user 消息转换
   - assistant 消息转换（不含推理）
   - assistant 消息转换（含推理）

2. **边界情况**（重要）：
   - 空历史记录
   - 未知角色抛错
   - 空/空白推理内容不添加 Part

3. **组合场景**（可选）：
   - 多条历史消息的顺序
   - 特殊字符和 Unicode 内容

**理由**：
- `buildMessages()` 是纯函数，测试成本低、收益高
- 消息格式转换是核心逻辑，必须保证正确性
- 推理内容是新功能，需要重点测试

---

### 4. streamChatCompletion() 测试策略

**决策**：Mock Vercel AI SDK，测试参数传递和错误处理，不测试流式响应的消费

**测试范围**：
- ✅ 参数验证和传递（model、apiKey、baseURL、fetch）
- ✅ 调用 `buildMessages()` 并传递结果
- ✅ `includeReasoningContent` 参数传递
- ✅ `conversationId` 和 `generateId` 逻辑
- ✅ `dangerouslyAllowBrowser` 参数传递
- ✅ AbortSignal 传递
- ✅ 错误传播（网络错误、API 错误）
- ❌ 流式响应的实际消费（由集成测试覆盖）

**理由**：
- AsyncGenerator 的测试较复杂，收益相对较低
- Mock 返回简单的 AsyncGenerator 即可验证调用逻辑
- 流式响应的消费更适合由 E2E 测试覆盖

**Mock 实现示例**：
```typescript
const mockStream = {
  [Symbol.asyncIterator]: async function* () {
    yield { text: 'Hello' };
    yield { text: ' World' };
  }
};
vi.mocked(streamText).mockResolvedValue(mockStream);
```

---

### 5. getProvider() 测试策略

**决策**：测试 switch 逻辑和错误处理，不测试供应商 SDK 的实际调用

**测试范围**：
- ✅ DeepSeek、Moonshot、Zhipu 的 provider 创建
- ✅ 返回值类型验证（函数）
- ❌ 不测试调用返回函数后的行为

**理由**：
- 供应商 SDK 的行为由其自身测试保证
- 我们的测试仅验证是否正确调用了供应商 SDK
- 深入测试供应商行为会使测试过于脆弱

---

### 6. 测试数据管理

**决策**：使用现有的测试辅助工具 `@/test-helpers`

```typescript
import {
  createMockModel,
  createMockMessage,
} from '@/test-helpers';
```

**理由**：
- 保持测试一致性
- 减少重复代码
- 集中管理测试数据结构

**如果缺少辅助工具**：在测试文件中创建简单的 fixture 函数
```typescript
const createMockChatParams = () => ({
  model: createMockModel(),
  historyList: [],
  message: 'Hello',
});
```

---

## Risks / Trade-offs

### 风险 1：Vercel AI SDK Mock 可能过时
**描述**：如果 Vercel AI SDK 更新 API，我们的 Mock 可能不再匹配真实行为

**缓解措施**：
- 定期运行 E2E 测试验证真实集成
- 在测试注释中注明 Mock 的预期行为
- 关注 Vercel AI SDK 的 changelog

---

### 风险 2：测试可能变得脆弱
**描述**：过度依赖内部实现细节可能导致测试频繁失败

**缓解措施**：
- 优先测试公共行为而非内部实现
- 使用参数化测试减少重复
- 保持测试简单，避免过度 Mock

---

### 风险 3：流式响应的 AsyncGenerator 测试复杂
**描述**：AsyncGenerator 的测试需要特殊的断言和异步处理

**缓解措施**：
- 使用简单的 Mock 返回值
- 仅测试参数传递，不测试实际消费
- 如果需要测试消费逻辑，使用 `for await...of` 循环

---

### 权衡 1：测试覆盖率 vs 维护成本
**决策**：目标 90% 语句覆盖率，而非 100%

**理由**：
- 边界情况（如极端输入）的测试成本高、收益低
- 100% 覆盖率可能导致测试过于脆弱
- 90% 已能提供足够的保护

---

### 权衡 2：单元测试 vs 集成测试
**决策**：仅添加单元测试，不添加集成测试

**理由**：
- 当前任务是提升单元测试覆盖率
- 集成测试应作为独立的任务
- 单元测试执行更快，更适合 TDD

---

## Migration Plan

### 阶段 1：准备（预计 5 分钟）
1. 创建测试文件备份：`cp src/__test__/services/chatService.test.ts src/__test__/services/chatService.test.ts.bak`
2. 清空现有测试文件内容

### 阶段 2：实施（预计 30 分钟）
1. 实现 `buildMessages()` 测试（最简单，先建立信心）
2. 实现 `getProvider()` 测试（次简单）
3. 实现 `streamChatCompletion()` 测试（最复杂）
4. 运行测试并查看覆盖率：`pnpm test:coverage -- src/__test__/services/chatService.test.ts`

### 阶段 3：验证（预计 10 分钟）
1. 检查覆盖率是否达标（90%+ 语句、80%+ 分支、100% 函数）
2. 运行完整测试套件确保没有破坏其他测试：`pnpm test`
3. 代码审查和重构

### 阶段 4：文档（预计 5 分钟）
1. 删除备份文件
2. 更新 AGENTS.md 中的测试覆盖率统计（如需要）

**回滚策略**：
- 如果测试失败率过高，恢复备份文件
- 如果覆盖率不达标，补充缺失的测试用例

---

## Open Questions

**Q1：是否需要测试 `streamChatCompletion()` 返回的 AsyncGenerator 的实际消费？**

**当前决策**：不需要，仅测试参数传递和错误处理

**理由**：AsyncGenerator 的消费逻辑由 Vercel AI SDK 保证，我们的测试聚焦于是否正确调用了 SDK

**重新评估条件**：如果在实际使用中发现流式响应处理频繁出错，则需要添加集成测试

---

**Q2：是否需要 Mock `getFetchFunc()` 的返回值？**

**当前决策**：不需要，让 `getFetchFunc()` 返回真实的 fetch 函数

**理由**：真实的 fetch 函数不会执行 HTTP 请求（因为我们 Mock 了整个供应商 SDK），Mock 反而增加复杂度

**重新评估条件**：如果测试执行缓慢或意外发起请求，则需要 Mock fetch 函数

---

**Q3：测试文件是否需要使用 `describe.each()` 进行参数化测试？**

**当前决策**：对于重复的场景（如三个供应商），使用 `describe.each()` 简化代码

**理由**：减少重复代码，提升可维护性

**示例**：
```typescript
describe.each([
  ['deepseek', ModelProviderKeyEnum.DEEPSEEK, createDeepSeek],
  ['moonshot', ModelProviderKeyEnum.MOONSHOTAI, createMoonshotAI],
  ['zhipu', ModelProviderKeyEnum.ZHIPUAI, createZhipu],
])('%s provider', (name, key, sdkFn) => {
  it('should create provider', () => {
    // 测试逻辑
  });
});
```

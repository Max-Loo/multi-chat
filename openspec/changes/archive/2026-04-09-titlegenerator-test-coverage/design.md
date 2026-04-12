## Context

`titleGenerator.ts` 的核心函数 `generateChatTitleService` 当前覆盖率 14.28%，主要原因是 Vercel AI SDK 的 `generateText` 在 Vitest 中难以 mock。现有测试仅覆盖两个辅助函数（`removePunctuation`、`truncateTitle`），核心函数通过集成测试间接覆盖但 mock 了函数本身。

当前函数签名为：
```typescript
async function generateChatTitleService(
  messages: StandardMessage[],
  model: Model
): Promise<string>
```

内部依赖链：`getProvider` → `generateText` → 后处理（`truncateTitle` + `removePunctuation`）→ 验证。

项目已在 `setup.ts` 中全局 mock `ai` 模块（包含 `generateText`），且多处测试使用 `vi.mock` 拦截模块导入。

## Goals / Non-Goals

**Goals:**
- 使 `generateChatTitleService` 可独立单元测试
- 将 prompt 构建逻辑提取为纯函数，消除测试盲区
- 覆盖率达到 80%+
- 保持函数签名干净，不将测试关注点混入生产代码

**Non-Goals:**
- 不修改 `generateChatTitleService` 的业务逻辑
- 不修改集成测试
- 不引入新的测试框架或工具

## Decisions

### 决策 1：vi.mock 模块拦截

**选择**：使用 `vi.mock` 拦截 `ai` 和 `@/services/chat/providerFactory` 模块，在测试中通过 `vi.mocked()` 覆盖 mock 行为。

```typescript
// ai 模块已在 setup.ts 全局 mock，测试中直接覆盖
vi.mocked(generateText).mockResolvedValue({ text: 'React 入门指南' });

// providerFactory 模块在测试文件中 mock
vi.mock('@/services/chat/providerFactory', () => ({
  getProvider: vi.fn(),
}));
```

**理由**：
- `setup.ts` 已全局 mock `ai` 模块（含 `generateText`），项目内大量测试依赖此机制
- 保持 `generateChatTitleService` 函数签名干净：`(messages, model)` → `Promise<string>`
- 测试关注点与生产代码完全分离

**备选方案**：
- 依赖注入（可选 `deps` 参数）→ 污染公共 API，将测试关注点混入业务签名
- `vi.spyOn` → 对 ESM named export 不稳定
- 重构为类 + 构造函数注入 → 过度设计，当前只有一个函数

### 决策 2：提取 `buildTitlePrompt` 纯函数

**选择**：将 prompt 构建逻辑提取为独立导出函数。

```typescript
export function buildTitlePrompt(messages: StandardMessage[]): string
```

**理由**：纯函数无需任何 mock 即可测试，覆盖消息提取和 prompt 模板两个逻辑分支。

### 决策 3：测试用例组织

**选择**：在现有测试文件中扩展，不创建新文件。

**理由**：测试对象同一模块，当前测试文件仅 85 行，扩展后仍合理。

## Risks / Trade-offs

- **[setup.ts 耦合]** 依赖 `setup.ts` 中的全局 mock → 项目已有成熟的全局 mock 机制，风险低
- **[覆盖率工具]** Listener Middleware 的覆盖率统计可能仍不准确 → 本次变更不涉及中间件，不受影响

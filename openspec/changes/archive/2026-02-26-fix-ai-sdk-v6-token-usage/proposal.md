## Why

当前代码使用了错误的 AI SDK v6 Token Usage 字段名（`promptTokens`/`completionTokens`），导致类型不安全且需要使用 `any` 类型断言。这不仅违反了类型安全原则，还可能导致运行时错误。正确的字段名应该是 `inputTokens`/`outputTokens`。

## What Changes

- 修改 `src/services/chatService.ts` 中 Token Usage 字段名
  - 将 `promptTokens` 改为 `inputTokens`
  - 将 `completionTokens` 改为 `outputTokens`
  - 移除不安全的 `(usage as any)` 类型断言
  - 使用正确的 `LanguageModelUsage` 类型访问 token 数据

## Capabilities

### New Capabilities
<!-- 本变更为 Bug 修复，不涉及新功能 -->

### Modified Capabilities
<!-- 本变更仅修复实现细节，不改变规范级别的行为要求 -->

## Impact

- **受影响代码**: `src/services/chatService.ts` (第 204-209 行)
- **外部 API**: 无影响（`StandardMessage.tokensUsage` 字段名保持不变）
- **依赖关系**: 无变化（仍使用 `ai@6.0.99`）
- **类型安全**: 提升类型安全性，消除 `any` 类型断言

## Why

当前 `StandardMessage.tokensUsage` 的字段命名（`completion`、`prompt`）不够直观，且与 Vercel AI SDK 返回的 `usage.inputTokens` 和 `usage.outputTokens` 命名不一致，导致需要在代码中进行字段映射转换。为了提升代码可读性和与主流 AI SDK 的兼容性，需要重构 tokensUsage 的类型定义。

## What Changes

- **BREAKING**: 重命名 `tokensUsage` 属性为 `usage`
- **BREAKING**: 重命名字段：
  - `prompt` → `inputTokens`
  - `completion` → `outputTokens`
- **BREAKING**: 移除 `cached` 可选字段（当前未被使用）
- 更新所有引用该类型的代码
- 更新相关的数据转换逻辑（chatService）

## Capabilities

### New Capabilities
- `token-usage-refactor`: 统一 token 使用量的类型定义，使其更符合主流 AI SDK 的命名规范

### Modified Capabilities
（无 spec-level 行为变更，仅涉及类型定义重构）

## Impact

- **类型定义**: `src/types/chat.ts` 中的 `StandardMessage` 接口
- **聊天服务**: `src/services/chatService.ts` 中的响应转换逻辑
- **所有使用 `tokensUsage` 的组件**: 需要更新为 `usage` 并调整字段访问

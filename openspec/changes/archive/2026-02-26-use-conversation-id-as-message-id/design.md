## Context

当前 `chatService.ts` 中的 `streamChatCompletion()` 函数在第 151 行使用 `generateId()` 自动生成消息 ID，但函数参数中已经存在 `conversationId` 字段（可选）未被使用。这导致 API 设计不一致，调用者传入的 `conversationId` 参数被忽略。

**当前代码位置**：`src/services/chatService.ts:151`
```typescript
const messageId = generateId();
```

**目标代码位置**：`src/services/chatService.ts:151`
```typescript
const messageId = params.conversationId ?? generateId();
```

## Goals / Non-Goals

**Goals:**
- 优先使用 `params.conversationId` 作为消息 ID
- 如果 `conversationId` 未提供，使用 `generateId()` 作为兜底逻辑
- 保持 API 向后兼容性（`conversationId` 仍为可选参数）
- 更新文档注释，说明消息 ID 的生成规则

**Non-Goals:**
- 不修改 `ChatRequestParams` 接口定义（`conversationId` 参数已存在）
- 不改变函数返回类型或行为
- 不涉及其他模块或组件的变更

## Decisions

### 决策 1：使用空值合并运算符 (`??`) 而非逻辑或 (`||`)

**选择**：使用 `params.conversationId ?? generateId()`

**理由**：
- `??` 只在值为 `null` 或 `undefined` 时使用默认值
- `||` 会在 falsy 值（如空字符串 `""`）时也使用默认值
- 如果 `conversationId` 是空字符串（虽然不太可能），`??` 会保留它，而 `||` 会替换为生成的 ID
- 更符合类型安全的语义（`conversationId?: string` 表示可选，而非必需真值）

### 决策 2：保持函数签名不变

**选择**：不修改 `ChatRequestParams` 接口定义

**理由**：
- `conversationId?: string` 参数已经存在
- 变更仅是修复未使用参数的问题，不是添加新功能
- 保持向后兼容性，不破坏现有调用代码

### 决策 3：使用解构赋值默认值而非显式 `??` 运算符

**选择**：使用 `const { conversationId = generateId() } = params;` 而非 `const messageId = params.conversationId ?? generateId();`

**理由**：
- 解构赋值默认值在底层使用 `??` 逻辑，行为完全等价
- 避免创建中间变量 `messageId`，直接使用 `conversationId`
- 代码更简洁，符合现代 JavaScript/TypeScript 最佳实践
- 保持与函数参数解构的一致性（`model`、`historyList`、`message` 也使用解构）

## Risks / Trade-offs

### 风险 1：现有调用代码可能依赖自动生成的 ID

**描述**：如果某些调用方传递了 `conversationId`，但期望返回的消息使用不同的 ID（虽然不太可能），这会导致行为变化。

**缓解措施**：
- 这是一个 bug 修复（参数未使用），不应该是破坏性变更
- 如果确实有这种场景，调用方应该在传入 `conversationId` 时明确期望它被使用
- 变更后的行为更符合直觉和 API 语义

### 风险 2：`conversationId` 语义可能与消息 ID 不一致

**描述**：`conversationId` 的语义是"对话 ID"，而 `messageId` 的语义是"消息 ID"，二者可能不同。

**缓解措施**：
- 在当前实现中，流式响应的所有消息共享同一个 ID（由 `generateId()` 生成）
- 这个 ID 在流式更新中保持不变，用于标识这一轮对话响应
- 使用 `conversationId` 作为这个标识是合理的，因为流式响应确实属于同一个对话
- 如果未来需要区分消息 ID 和对话 ID，可以添加独立的 `messageId` 参数

## 迁移计划

### 部署步骤

1. 修改 `src/services/chatService.ts:151` 行的代码
2. 更新函数文档注释（第 99-130 行），说明消息 ID 生成规则
3. 运行 `pnpm tsc` 进行类型检查
4. 运行 `pnpm lint` 进行代码检查
5. 手动测试流式聊天功能，验证消息 ID 的生成

### 回滚策略

如果发现问题，可以直接回滚到原始实现：
```typescript
const messageId = generateId();
```

由于变更局限于单个文件的单行代码，回滚风险很低。

## Open Questions

无（这是一个简单的实现优化，没有未解决的技术问题）

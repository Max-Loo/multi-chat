## Why

当前 `chatService.ts` 中 `streamChatCompletion()` 函数自动生成 `messageId`，但 API 参数中已经存在 `conversationId` 字段未被使用。这导致 API 设计不一致，用户传入的 `conversationId` 无法起到预期的标识作用。需要统一消息 ID 的生成逻辑，优先使用用户提供的 `conversationId`，确保 API 语义清晰。

## What Changes

- 修改 `streamChatCompletion()` 函数的消息 ID 生成逻辑
  - 优先使用 `params.conversationId` 作为消息 ID
  - 如果 `conversationId` 未提供，使用 `generateId()` 作为兜底生成逻辑
- 保持 API 向后兼容性（`conversationId` 仍为可选参数）
- 更新函数文档注释，说明消息 ID 的生成规则

## Capabilities

### New Capabilities
无（本变更为实现细节优化，不引入新能力）

### Modified Capabilities
无（spec 级别需求未发生变化，仅优化内部实现）

## Impact

- **受影响代码**：`src/services/chatService.ts` 第 151 行（`messageId` 生成逻辑）
- **API 变更**：无（`conversationId` 参数已存在，仅是现在正确使用它）
- **依赖变更**：无
- **系统影响**：无（仅优化实现，不改变行为）

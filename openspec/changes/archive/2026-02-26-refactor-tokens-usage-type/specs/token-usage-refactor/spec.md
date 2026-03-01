## ADDED Requirements

### Requirement: StandardMessage 使用统一的 usage 属性
系统 SHALL 在 `StandardMessage` 接口中使用 `usage` 属性替代 `tokensUsage`，该属性包含 `inputTokens` 和 `outputTokens` 字段，与 Vercel AI SDK 返回的 usage 格式保持一致。

#### Scenario: 新消息包含正确的 usage 结构
- **WHEN** 系统创建新的 `StandardMessage` 对象
- **THEN** 该对象 SHALL 包含 `usage` 属性
- **AND** `usage.inputTokens` SHALL 为数字类型，表示输入 token 数量
- **AND** `usage.outputTokens` SHALL 为数字类型，表示输出 token 数量

#### Scenario: usage 字段与 Vercel AI SDK 兼容
- **WHEN** 系统从 Vercel AI SDK 接收流式响应
- **THEN** 系统 SHALL 能够直接映射 `response.usage.inputTokens` 到 `StandardMessage.usage.inputTokens`
- **AND** 系统 SHALL 能够直接映射 `response.usage.outputTokens` 到 `StandardMessage.usage.outputTokens`
- **AND** 不需要额外的字段名转换逻辑

### Requirement: 代码中使用语义化的 token 命名
系统 SHALL 在所有代码中使用 `inputTokens` 和 `outputTokens` 命名，以明确表示 token 的用途和方向。

#### Scenario: chatService 正确提取 usage 数据
- **WHEN** `chatService.ts` 从 AI SDK 响应中提取 token 使用信息
- **THEN** 系统 SHALL 设置 `message.usage.inputTokens` 为输入 token 数量
- **AND** 系统 SHALL 设置 `message.usage.outputTokens` 为输出 token 数量
- **AND** 不需要额外的字段映射转换

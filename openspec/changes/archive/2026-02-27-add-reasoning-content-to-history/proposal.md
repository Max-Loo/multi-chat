## Why

当前 `chatService.ts` 在构建历史消息时，仅发送 `content` 字段，忽略了 `reasoningContent`。对于支持推理能力的模型（如 DeepSeek R1），历史推理内容提供了重要的上下文信息，有助于模型更好地理解之前的思考过程并提高响应质量。

## What Changes

- 在聊天页面添加开关按钮，让用户控制是否在历史消息中传输 `reasoningContent`
- 修改 `buildMessages` 函数，根据开关状态决定是否包含 `reasoningContent`
- 确保消息格式兼容所有模型供应商（DeepSeek、Moonshot、Zhipu）
- 保持向后兼容性，对于没有 `reasoningContent` 的消息不产生副作用
- 将开关状态保存到本地存储，在会话间持久化
- 默认关闭开关（不传输 reasoning content），由用户主动开启

## Capabilities

### New Capabilities
- `reasoning-content-propagation`: 在聊天历史中传播推理内容，确保支持推理能力的模型能够访问完整的上下文信息
- `reasoning-content-toggle`: 在聊天界面提供开关控件，允许用户控制是否传输历史推理内容

### Modified Capabilities
- 无（仅实现细节变更，不改变现有 spec 级别的行为要求）

## Impact

**受影响的代码**：
- `src/services/chatService.ts` - `buildMessages` 函数，添加开关参数
- `src/store/slices/` - 添加开关状态管理
- 聊天页面 UI 组件 - 添加开关按钮

**API 变更**：
- `streamChatCompletion` 函数添加 `includeReasoningContent` 可选参数

**依赖**：
- 无新增依赖

**系统影响**：
- 开关开启时增加 token 使用量（取决于历史 reasoningContent 的累积大小）
- 用户可通过开关控制 token 消耗和响应质量之间的平衡
- 开关状态持久化到本地存储

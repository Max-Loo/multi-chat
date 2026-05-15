## ADDED Requirements

### Requirement: 基于编辑消息的重新生成

系统 SHALL 支持在编辑最新用户消息后，重新生成对应的最新 AI 回复。

#### Scenario: 编辑消息后重新生成
- **WHEN** 用户确认编辑最新一条用户消息
- **THEN** 系统 SHALL 使用编辑后的 content 更新该位置的消息（保留旧版本到数组）
- **AND** 对应位置的 AI 回复旧内容保留到数组，追加空字符串占位（等待重新生成填充）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（至编辑后的用户消息为止，不包含旧 AI 回复，每条消息取 content 数组最后一个元素）重新调用 `streamChatCompletion`
- **AND** 生成的回复填充到 AI 回复 content 数组的最后一个元素（替换占位空字符串）

#### Scenario: 编辑消息时 AI 回复不存在
- **WHEN** 用户确认编辑最新一条用户消息
- **AND** 该用户消息之后不存在 AI 回复（上一轮发送失败，AI 回复未生成）
- **THEN** 系统 SHALL 仅更新用户消息的 content 数组
- **AND** 对每个 ChatModel，使用编辑后的用户消息作为最新消息重新调用 `streamChatCompletion`

#### Scenario: 编辑消息时模型已被禁用
- **WHEN** 用户编辑消息后重新生成
- **AND** 某个模型已被用户禁用（`isEnable === false`）
- **THEN** 系统 SHALL 跳过该模型，不发送请求

#### Scenario: 编辑消息时模型已被删除
- **WHEN** 用户编辑消息后重新生成
- **AND** 某个模型已被删除（`isDeleted === true`）
- **THEN** 系统 SHALL 跳过该模型，不发送请求

#### Scenario: 重新生成失败时回滚
- **WHEN** 编辑后 AI 回复重新生成失败
- **THEN** 系统 SHALL 调用 `rollbackEdit` 回滚用户消息和 AI 回复的数组
- **AND** 恢复到编辑前的状态

---

### Requirement: 重新生成最后一条 AI 回复

系统 SHALL 支持重新生成最后一条 AI 回复，保留旧版本到历史数组。

#### Scenario: 重新生成最后 AI 回复
- **WHEN** 用户点击重新生成按钮
- **THEN** 系统 SHALL 通过位置索引，对所有 ChatModel 的 AI 回复消息，将旧 content 和 reasoningContent push 进数组，追加空字符串占位
- **AND** 对每个 ChatModel，使用该消息之前的完整对话历史重新调用 `streamChatCompletion`
- **AND** 生成的回复填充到 content 数组末尾（替换占位空字符串）

#### Scenario: 重新生成时的流式处理
- **WHEN** 系统执行重新生成
- **THEN** thunk SHALL 直接调用 `streamChatCompletion`（不经过 `sendMessage`）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（`chatHistoryList.slice(0, assistantMessageIndex)`，不包含旧 AI 回复）作为上下文
- **AND** 流式响应通过 `pushRunningChatHistory` 写入 `runningChat` 状态临时存储（复用现有机制）
- **AND** 每个模型流式完成后，dispatch `updateHistoryContent` 将 AI 回复 content 数组最后一个元素（占位空字符串）替换为实际生成结果
- **AND** 若生成结果包含 `reasoningContent`，一并更新 reasoningContent 数组最后一个元素

#### Scenario: 编辑后重新生成的流式处理
- **WHEN** 系统执行编辑后重新生成
- **THEN** thunk SHALL 直接调用 `streamChatCompletion`（不经过 `sendMessage`）
- **AND** 对每个 ChatModel，使用裁剪后的对话历史（`chatHistoryList.slice(0, userMessageIndex + 1)`，包含编辑后的用户消息，不包含旧 AI 回复）作为上下文
- **AND** 流式响应通过 `pushRunningChatHistory` 写入 `runningChat` 状态临时存储
- **AND** 每个模型流式完成后，dispatch `updateHistoryContent` 更新 AI 回复 content 数组

#### Scenario: 重新生成失败时回滚
- **WHEN** AI 回复重新生成失败
- **THEN** 系统 SHALL 调用 `rollbackRegenerate` 回滚 AI 回复的 content/reasoningContent 数组
- **AND** 弹出 `commitRegenerate` 添加的占位空字符串
- **AND** 恢复到重新生成前的状态

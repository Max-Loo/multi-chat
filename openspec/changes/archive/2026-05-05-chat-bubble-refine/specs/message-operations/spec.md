## MODIFIED Requirements

### Requirement: 重新生成 AI 回复

系统 SHALL 允许用户重新生成对话中最后一条 AI 助手回复，采用覆盖策略替换当前版本内容。

#### Scenario: 重新生成最后一条 AI 回复
- **WHEN** 用户点击最后一条 AI 助手消息上的重新生成按钮
- **THEN** 系统通过位置索引，对所有 ChatModel 的 AI 回复消息，将当前 content 和 reasoningContent 的最后一个元素暂存到 `runningChat` 的回滚字段中
- **AND** 将 content 最后一个元素替换为空字符串占位
- **AND** 将 reasoningContent 最后一个元素替换为空字符串占位（若存在）
- **AND** 对每个 ChatModel，使用该消息之前的完整对话历史，重新调用 `streamChatCompletion`
- **AND** 新生成的回复填充到数组末尾（替换占位空字符串）
- **AND** 数组长度不变（覆盖而非追加）

#### Scenario: 重新生成按钮仅出现在最后一条 AI 回复上
- **WHEN** 渲染非最后一条 AI 助手消息时
- **THEN** 不显示重新生成按钮

#### Scenario: AI 消息生成中隐藏操作栏
- **WHEN** AI 助手消息正在流式生成中（`isRunning === true`）
- **THEN** 不显示操作工具栏（包括复制和重新生成按钮）
- **AND** 生成完成后（`isRunning === false`）恢复显示操作工具栏

#### Scenario: 重新生成正在发送中的消息
- **WHEN** 用户尝试重新生成，但该聊天正在发送中
- **THEN** 重新生成按钮 SHALL 处于禁用状态

#### Scenario: 重新生成失败时回滚
- **WHEN** AI 回复重新生成失败
- **THEN** 系统调用 `rollbackRegenerate` 从 `runningChat` 暂存字段恢复 AI 回复的 content 和 reasoningContent
- **AND** 恢复为重新生成前的内容，数组长度不变

---

### Requirement: 编辑历史翻页浏览

系统 SHALL 允许用户翻页浏览消息的编辑历史，翻页控件仅在用户消息上显示，AI 消息版本通过配对联动控制。

#### Scenario: 浏览有历史的消息
- **WHEN** 消息的 `content` 为 `string[]`（有编辑历史）
- **THEN** 气泡显示当前版本内容（数组最后一个元素）
- **AND** 仅在用户消息上显示翻页指示器（如"2/3"表示当前查看第 2 版，共 3 个版本）

#### Scenario: 切换历史版本
- **WHEN** 用户点击用户消息的翻页控件
- **THEN** 用户消息气泡内容切换为对应下标的内容
- **AND** 配对的 AI 回复自动切换为同一下标的版本（成对展示）
- **AND** AI 消息不显示独立翻页控件

#### Scenario: 浏览无历史的消息
- **WHEN** 消息的 `content` 为 `string`（无编辑历史）
- **THEN** 正常显示消息内容，不显示翻页控件

#### Scenario: 历史版本对 AI 发送无影响
- **WHEN** 用户发送新消息时
- **THEN** `buildMessages` 只取每条消息 `content` 数组的最后一个元素
- **AND** 旧版本不参与 AI 请求构建

---

### Requirement: 消息操作的数据一致性

系统 SHALL 确保消息操作在多模型并发场景下的数据一致性。

#### Scenario: 编辑操作通过位置索引跨模型同步
- **WHEN** 用户编辑一条消息
- **THEN** 系统通过位置索引定位所有 ChatModel 的 chatHistoryList 中对应位置的消息
- **AND** 所有模型中该位置的用户消息和 AI 回复 content 数组同步更新
- **AND** 用户消息 ID 在不同模型间各不相同，但位置索引保证操作一致性

#### Scenario: 重新生成覆盖策略保证版本对齐
- **WHEN** 用户重新生成 AI 回复
- **THEN** AI 消息的 content 和 reasoningContent 数组长度不变（原地覆盖）
- **AND** 用户消息和 AI 消息的 content 数组长度始终一致（仅通过编辑操作同步增长）

#### Scenario: 操作后持久化
- **WHEN** 任意消息操作（编辑/重新生成）完成后
- **THEN** chatMiddleware 监听到对应 action 并调用 `saveChatAndIndex` 持久化
- **AND** `updatedAt` 时间戳更新为当前时间

## ADDED Requirements

### Requirement: 用户消息操作栏独立布局

系统 SHALL 将用户消息的操作栏和翻页器从气泡色块内部移到外部独立显示。

#### Scenario: 操作栏独立于气泡色块
- **WHEN** 渲染用户消息气泡时
- **THEN** 操作栏（复制、编辑按钮）和翻页器显示在气泡色块外部下方
- **AND** 操作栏和翻页器位于同一行，右对齐
- **AND** 翻页器位于操作栏按钮的右侧

#### Scenario: 操作栏不继承气泡背景色
- **WHEN** 用户消息气泡使用灰色背景（`bg-gray-100`）
- **THEN** 操作栏和翻页器区域不使用气泡背景色，保持透明

#### Scenario: 操作栏宽度跟随气泡
- **WHEN** 用户消息气泡宽度随内容自适应
- **THEN** 操作栏行的宽度与气泡宽度一致，均受 `max-w-[80%]` 限制

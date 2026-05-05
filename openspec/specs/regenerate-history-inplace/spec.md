## ADDED Requirements

### Requirement: 重新生成操作指定历史版本
系统 SHALL 允许用户在浏览非最新历史版本时，对当前选中的历史版本执行重新生成操作，原地覆盖该版本的内容，而非总是覆盖最新版本。

#### Scenario: 翻到早期版本重新生成
- **WHEN** 用户通过翻页器浏览到 AI 回复的 index=0（历史版本），content 数组长度 > 1
- **THEN** 系统原地覆盖 `content[0]`，保留其余版本不变；视图停留在 index=0，不跳转到最新版本

#### Scenario: 浏览最新版本重新生成（向后兼容）
- **WHEN** 用户未翻页或翻到最新版本（index = content.length - 1）
- **THEN** 行为与当前完全一致：覆盖最后一个元素

#### Scenario: content 为 string（无编辑历史）重新生成
- **WHEN** AI 回复的 content 是 string 类型（无编辑历史）
- **THEN** 直接覆盖该 string，行为与当前一致

### Requirement: 重新生成使用对应版本的用户消息作为 prompt
系统 SHALL 在重新生成时，使用与当前浏览的历史索引对应的用户消息版本作为 API 的 prompt，而非总是使用用户消息的最新版本。

#### Scenario: 翻到早期版本时 prompt 取对应版本
- **WHEN** 用户浏览到 AI 回复的 index=0，配对的用户消息 content 为 `["原始问题", "编辑后的问题"]`
- **THEN** 发送给 API 的 message 参数为 `"原始问题"`（content[0]）

#### Scenario: 最新版本时 prompt 取最新（向后兼容）
- **WHEN** 用户浏览到最新版本
- **THEN** 发送给 API 的 message 参数为 `getCurrentContent(userMessage.content)`，行为与当前一致

### Requirement: historyIndex 全链路传递
系统 SHALL 将当前浏览的历史索引从 ChatBubble 组件传递到 chatHistoryHelper 层，覆盖提交、回滚、更新三个环节。

#### Scenario: ChatBubble 传递 historyIndex 给父组件
- **WHEN** 用户点击重新生成按钮
- **THEN** onRegenerate 回调同时传递 messageId 和当前 historyIndex

#### Scenario: commitRegenerate 按 historyIndex 覆盖
- **WHEN** commitRegenerate 收到 historyIndex=0，content 为 `["旧回答", "新回答"]`
- **THEN** 将 `content[0]` 存入 rollbackContent，并将 `content[0]` 置为空字符串

#### Scenario: rollbackRegenerate 按 historyIndex 恢复
- **WHEN** rollbackRegenerate 收到 historyIndex=0
- **THEN** 从 rollbackContent 恢复到 `content[0]`

#### Scenario: updateHistoryContent 按 historyIndex 写入
- **WHEN** 流式完成后 updateHistoryContent 收到 historyIndex=0
- **THEN** 将新生成的内容写入 `content[0]`

### Requirement: historyIndex 越界防护
系统 SHALL 对传入的 historyIndex 进行越界检查，防止数组长度变化导致越界访问。

#### Scenario: historyIndex 超出数组范围
- **WHEN** historyIndex 大于 content 数组的最大索引
- **THEN** 自动 clamp 到 `Math.min(historyIndex, arr.length - 1)`

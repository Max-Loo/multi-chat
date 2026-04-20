## ADDED Requirements

### Requirement: DOM 元素匹配更新
系统 SHALL 通过语言类名和文本内容匹配 code 元素，找到匹配元素后更新其 innerHTML。

#### Scenario: 找到匹配的 code 元素并更新
- **WHEN** 调用 updateCodeBlockDOM('console.log("hi")', 'javascript', '<span>code</span>')
- **THEN** 系统查找 `code[class*="language-javascript"]` 且 textContent 匹配的元素，更新其 innerHTML

#### Scenario: 无匹配元素时不更新
- **WHEN** 调用 updateCodeBlockDOM('code', 'python', '<span>code</span>')，但 DOM 中无匹配元素
- **THEN** 不修改任何 DOM 元素，且在未达最大重试次数时触发重试

#### Scenario: 匹配到的元素已不在 DOM 中则跳过
- **WHEN** querySelectorAll 匹配到一个 code 元素但 document.contains 返回 false
- **THEN** 跳过该元素，不更新 innerHTML，视为未更新（触发重试）

### Requirement: 重试机制
系统 SHALL 在未找到匹配元素时按递增延迟重试（0, 16, 50, 100, 200, 300ms），最多重试 maxRetries 次。

#### Scenario: 首次未找到元素后重试
- **WHEN** 首次尝试未找到匹配元素且 retryCount < maxRetries
- **THEN** 系统以 delays[retryCount] 的延迟重新尝试

#### Scenario: 达到最大重试次数后停止
- **WHEN** retryCount >= maxRetries（默认 5）仍未找到元素
- **THEN** 停止重试

### Requirement: 生命周期管理
系统 SHALL 使用 WeakRef 跟踪已更新的元素，5 秒后自动清理记录。

#### Scenario: 更新后记录待更新信息
- **WHEN** 成功更新一个 code 元素
- **THEN** getPendingUpdatesCount() 增加 1

#### Scenario: 5 秒后自动清理记录
- **WHEN** 元素更新后经过 5 秒
- **THEN** getPendingUpdatesCount() 恢复到更新前的值

### Requirement: 清理所有待更新记录
系统 SHALL 提供 cleanupPendingUpdates 函数清空所有记录。

#### Scenario: 手动清理所有记录
- **WHEN** 调用 cleanupPendingUpdates()
- **THEN** getPendingUpdatesCount() 返回 0

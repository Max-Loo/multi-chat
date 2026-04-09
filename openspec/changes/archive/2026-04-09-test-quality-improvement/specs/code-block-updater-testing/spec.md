## ADDED Requirements

### Requirement: DOM 元素成功更新
`updateCodeBlockDOM` SHALL 将高亮后的 HTML 内容正确写入目标 DOM 元素。

#### Scenario: 目标元素存在时成功更新
- **WHEN** 目标代码块元素存在于 DOM 中
- **THEN** 元素的 innerHTML MUST 被设置为 highlightedHtml

#### Scenario: 目标元素不存在时触发重试
- **WHEN** 目标代码块元素不存在于 DOM 中
- **THEN** MUST 在延迟后重试查找元素，直到达到最大重试次数

### Requirement: 重试机制
`updateCodeBlockDOM` SHALL 实现带延迟的重试机制，默认最多重试 5 次。

#### Scenario: 达到最大重试次数后停止
- **WHEN** 目标元素始终不存在，重试次数达到上限
- **THEN** MUST 停止重试，不抛出错误

#### Scenario: 重试过程中元素出现后成功更新
- **WHEN** 前几次重试时元素不存在，后续重试时元素出现
- **THEN** MUST 成功更新元素内容，不再继续重试

### Requirement: 内容匹配避免错误更新
更新操作 SHALL 验证目标元素内容与预期代码匹配，避免更新错误元素。

#### Scenario: 内容不匹配时跳过更新
- **WHEN** 目标元素的现有内容与预期代码不匹配
- **THEN** MUST 跳过该元素的更新

#### Scenario: 元素已从 DOM 树中移除时跳过更新
- **WHEN** 目标元素被 `querySelectorAll` 匹配到，但 `document.contains` 返回 false
- **THEN** MUST 跳过该元素（不更新 innerHTML），若所有匹配元素均被跳过则继续重试

### Requirement: 待更新计数和清理
系统 SHALL 提供查询待更新数量和清理功能。

#### Scenario: 查询待更新数量
- **WHEN** 调用 getPendingUpdatesCount
- **THEN** MUST 返回当前待处理的更新数量

#### Scenario: 清理所有待更新
- **WHEN** 调用 cleanupPendingUpdates
- **THEN** 所有待处理的更新 MUST 被清除，getPendingUpdatesCount MUST 返回 0

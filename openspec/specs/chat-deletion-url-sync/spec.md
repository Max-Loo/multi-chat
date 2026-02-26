# 聊天删除时的 URL 同步清除能力规格说明

## ADDED Requirements

### Requirement: 删除聊天时同步清除 URL 查询参数

系统 MUST 在用户删除聊天时同步清除 URL 查询参数中的 `chatId`，确保 URL 与 Redux state 保持一致。

#### Scenario: 删除当前选中的聊天时清除 URL 查询参数
- **WHEN** 用户在聊天列表中删除当前选中的聊天
- **AND** URL 查询参数包含 `chatId`
- **AND** `chatId` 的值等于被删除聊天的 ID
- **THEN** 系统 MUST 清除 URL 中的 `chatId` 查询参数
- **AND** URL 从 `/chat?chatId=xxx` 变为 `/chat`
- **AND** Redux state 中的 `selectedChatId` 被设置为 `null`

#### Scenario: 删除非当前选中的聊天时不修改 URL
- **WHEN** 用户删除一个非当前选中的聊天
- **AND** URL 查询参数包含 `chatId`
- **AND** `chatId` 的值不等于被删除聊天的 ID
- **THEN** 系统 MUST 保持 URL 查询参数不变
- **AND** URL 中的 `chatId` 值保持原样
- **AND** Redux state 中的 `selectedChatId` 保持不变

#### Scenario: 删除聊天后用户刷新页面不加载已删除的聊天
- **WHEN** 用户删除了当前选中的聊天
- **AND** URL 查询参数已被清除（URL 变为 `/chat`）
- **AND** 用户刷新页面
- **THEN** 系统 MUST NOT 尝试加载已删除的聊天
- **AND** Redux state 中的 `selectedChatId` 保持为 `null`
- **AND** 聊天界面显示空状态或默认视图

### Requirement: 提供导航辅助函数用于清除查询参数

系统 MUST 提供导航辅助函数用于清除聊天相关的 URL 查询参数。

#### Scenario: 使用导航辅助函数清除 chatId 查询参数
- **WHEN** 代码调用 `navigateToChatWithoutParams()` 函数
- **THEN** 系统 MUST 将 URL 导航到 `/chat`（不包含任何查询参数）
- **AND** 系统 MUST 清除所有现有的查询参数
- **AND** 浏览器历史记录中添加新的导航记录

#### Scenario: 导航辅助函数不影响其他路由参数
- **WHEN** URL 为 `/chat?chatId=xxx&otherParam=value`
- **AND** 代码调用 `navigateToChatWithoutParams()` 函数
- **THEN** 系统 MUST 将 URL 导航到 `/chat`（清除所有查询参数）
- **AND** 系统 MUST 同时清除 `chatId` 和 `otherParam`

### Requirement: 删除操作失败时不修改 URL

系统 MUST 在删除聊天操作失败时保持 URL 和 Redux state 不变。

#### Scenario: 删除聊天操作失败时保持 URL 不变
- **WHEN** 用户尝试删除聊天
- **AND** 删除操作失败（抛出异常或返回错误）
- **THEN** 系统 MUST 保持 URL 查询参数不变
- **AND** URL 中的 `chatId` 保持原值
- **AND** 系统 MUST 显示错误提示给用户
- **AND** Redux state 中的 `selectedChatId` 保持不变

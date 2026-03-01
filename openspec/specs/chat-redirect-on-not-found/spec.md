# 聊天不存在时的重定向能力规格说明

## ADDED Requirements

### Requirement: URL 参数中的聊天不存在时自动重定向

系统 MUST 在检测到 URL 查询参数中的 `chatId` 对应的聊天不存在时，自动重定向到默认的 `/chat` 页面。

#### Scenario: 通过 URL 访问已删除的聊天时重定向
- **WHEN** 用户通过 URL `/chat?chatId=xxx` 访问应用
- **AND** URL 中的 `chatId` 对应的聊天已被删除
- **THEN** 系统 MUST 自动重定向到 `/chat` 页面（清除 `chatId` 查询参数）
- **AND** 系统 MUST NOT 显示错误状态或空白页面
- **AND** Redux state 中的 `selectedChatId` 被设置为 `null`

#### Scenario: 通过 URL 访问从未存在的聊天时重定向
- **WHEN** 用户通过 URL `/chat?chatId=invalid-id` 访问应用
- **AND** `chatId` 不对应任何聊天（从未创建或 ID 格式无效）
- **THEN** 系统 MUST 自动重定向到 `/chat` 页面
- **AND** 系统 MUST 显示默认的聊天界面（空状态或欢迎界面）

#### Scenario: 重定向后用户刷新页面保持默认视图
- **WHEN** 系统已从 `/chat?chatId=xxx` 重定向到 `/chat`
- **AND** 用户刷新页面
- **THEN** 系统 MUST 保持 URL 为 `/chat`（不包含 `chatId` 参数）
- **AND** 系统 MUST NOT 再次尝试重定向
- **AND** Redux state 中的 `selectedChatId` 保持为 `null`

### Requirement: 在加载聊天数据前验证聊天存在性

系统 MUST 在尝试加载聊天数据之前验证 `chatId` 是否有效，避免加载不存在的数据。

#### Scenario: 页面加载时验证 chatId
- **WHEN** 应用启动或用户导航到 `/chat?chatId=xxx`
- **THEN** 系统 MUST 在发起聊天数据请求前验证 `chatId` 是否存在于聊天列表中
- **AND** 如果 `chatId` 不存在，系统 MUST 立即重定向到 `/chat`（不发起数据请求）
- **AND** 如果 `chatId` 存在，系统 MUST 正常加载聊天数据

#### Scenario: 验证逻辑不影响正常聊天加载
- **WHEN** 用户访问 `/chat?chatId=xxx`
- **AND** `chatId` 对应的聊天存在
- **THEN** 系统 MUST 正常加载并显示该聊天
- **AND** 系统 MUST NOT 执行任何重定向
- **AND** URL 中的 `chatId` 查询参数保持不变

### Requirement: 重定向逻辑与删除操作的兼容性

系统 MUST 确保重定向逻辑与现有的聊天删除 URL 同步机制兼容，避免冲突或重复处理。

#### Scenario: 删除当前聊天后手动刷新页面触发重定向
- **WHEN** 用户删除了当前选中的聊天
- **AND** URL 已被清除为 `/chat`（根据 chat-deletion-url-sync 规范）
- **AND** 用户手动在浏览器地址栏输入旧 URL `/chat?chatId=deleted-id` 并访问
- **THEN** 系统 MUST 检测到 `chatId` 对应的聊天不存在
- **AND** 系统 MUST 自动重定向到 `/chat`
- **AND** 系统 MUST NOT 保留或恢复已删除聊天的数据

#### Scenario: 重定向不触发删除操作
- **WHEN** 系统执行从 `/chat?chatId=xxx` 到 `/chat` 的重定向
- **THEN** 系统 MUST 仅清除 URL 参数，不执行任何删除操作
- **AND** 重定向操作 MUST 不修改 Redux state 中的聊天列表数据
- **AND** 重定向操作 MUST 不触发任何持久化数据的修改

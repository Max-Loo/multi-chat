## ADDED Requirements

### Requirement: 创建新聊天时立即设置选中的聊天 ID

系统 SHALL 在创建新聊天时同步设置 `selectedChatId`，无需等待 useEffect 执行。

#### Scenario: 创建新聊天后 selectedChatId 立即更新
- **WHEN** 用户创建新聊天
- **THEN** `selectedChatId` SHALL 立即被设置为新聊天的 ID
- **AND** URL 参数 SHALL 包含新聊天的 ID

#### Scenario: 创建新聊天不触发 SDK 预加载
- **WHEN** 用户创建新聊天
- **THEN** 系统 SHALL NOT 尝试预加载供应商 SDK（新聊天无模型）

### Requirement: 保留 URL 同步机制

系统 SHALL 保留 ChatPage 中 URL → Redux 的同步机制，以支持其他入口场景。

#### Scenario: 通过 URL 直接访问聊天时正确选中
- **WHEN** 用户通过 URL `/chat?chatId=xxx` 访问页面
- **AND** 聊天 xxx 存在且未删除
- **THEN** `selectedChatId` SHALL 被设置为 xxx

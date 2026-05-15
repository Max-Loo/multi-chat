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

系统 SHALL 保留 ChatPage 中 URL → Redux 的同步机制，以支持其他入口场景。useEffect 仅在 `searchParams` 变化时触发，不依赖 `chatMetaList` 变化。

#### Scenario: 通过 URL 直接访问聊天时正确选中
- **WHEN** 用户通过 URL `/chat?chatId=xxx` 访问页面
- **AND** 聊天 xxx 存在且未删除
- **THEN** `selectedChatId` SHALL 被设置为 xxx

#### Scenario: URL 指向不存在或已删除的聊天时清除参数
- **WHEN** 用户通过 URL `/chat?chatId=xxx` 访问页面
- **AND** 聊天 xxx 不存在或已被删除（不在 chatMetaList 中）
- **THEN** 系统 SHALL 清除 URL 中的 chatId 参数（不 dispatch thunk，防止 `loadChatById` 加载已软删除的聊天数据）

#### Scenario: URL 未变化时 useEffect 不触发
- **WHEN** `chatMetaList` 因重命名、AI 自动命名等原因变化
- **AND** `searchParams` 未变化
- **THEN** useEffect SHALL NOT 重新 dispatch `setSelectedChatIdWithPreload`

#### Scenario: URL 变化时 useEffect 正常触发
- **WHEN** 用户通过导航改变 URL 中的 `chatId` 参数
- **THEN** useEffect SHALL dispatch `setSelectedChatIdWithPreload` 加载新聊天数据

### Requirement: 删除聊天时清理 URL 参数

系统 SHALL 在删除当前 URL 中 `chatId` 指向的聊天时，清除 URL 中的 `chatId` 参数。

#### Scenario: 删除当前查看的聊天
- **WHEN** 用户删除聊天 A，且当前 URL 为 `/chat?chatId=A`
- **THEN** 系统 SHALL 将 URL 更新为 `/chat`（清除 chatId 参数）

#### Scenario: 删除其他聊天不影响当前 URL
- **WHEN** 用户删除聊天 B，但当前 URL 为 `/chat?chatId=A`（A ≠ B）
- **THEN** 系统 SHALL NOT 修改 URL

### Requirement: 新建聊天时 Content 正确展示 ModelSelect

#### Scenario: 从已有模型的聊天页面新建聊天
- **WHEN** 用户在已有模型的聊天页面点击"新建聊天"
- **THEN** Content 组件 SHALL 展示 `<ModelSelect />` 模型选择页面，而非 `<Placeholder />`

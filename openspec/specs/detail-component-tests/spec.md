## ADDED Requirements

### Requirement: 虚拟化渲染消息列表

Detail 组件 SHALL 将历史消息通过 Virtualizer 虚拟化渲染，当消息数量超出视口时只渲染可见范围内的消息。

#### Scenario: 大量消息只渲染可见项
- **WHEN** 有 50 条历史消息且视口只能显示约 8 条
- **THEN** 只有可见范围内（含 overscan）的 ChatBubble 被渲染

#### Scenario: 少量消息全部渲染
- **WHEN** 有 3 条历史消息且视口可容纳
- **THEN** 全部 3 个 ChatBubble 被渲染

### Requirement: Title 始终渲染不被虚拟化

Title 组件 SHALL 在 Virtualizer 外部渲染，无论消息数量和滚动位置如何变化都始终可见。

#### Scenario: Title 不被虚拟化回收
- **WHEN** 有大量消息并滚动到底部
- **THEN** Title 仍然存在于 DOM 中

### Requirement: RunningBubble 在 Virtualizer 外部渲染

RunningBubble SHALL 在 Virtualizer 外部独立渲染，不参与虚拟化，其高度变化不影响虚拟化测量。

#### Scenario: 流式消息独立于虚拟化
- **WHEN** 存在流式运行数据（isSending=true）
- **THEN** RunningBubble 渲染在 Virtualizer 容器之外

#### Scenario: 无流式数据时不渲染
- **WHEN** 没有流式运行数据
- **THEN** RunningBubble 返回 null

### Requirement: 回到底部按钮显示逻辑

Detail 组件 SHALL 在"需要滚动条且不在底部"时显示回到底部按钮。

#### Scenario: 内容超出视口且不在底部
- **WHEN** 消息内容超出视口且用户已向上滚动
- **THEN** 显示回到底部按钮

#### Scenario: 在底部时隐藏按钮
- **WHEN** 消息内容超出视口但用户在底部
- **THEN** 不显示回到底部按钮

#### Scenario: 内容不需滚动时隐藏按钮
- **WHEN** 消息内容未超出视口
- **THEN** 不显示回到底部按钮

### Requirement: 流式自动跟随

当用户在底部且有流式数据更新时，Detail 组件 SHALL 自动滚动到底部。当用户已主动向上滚动时，SHALL NOT 自动滚动。

#### Scenario: 用户在底部时自动跟随流式更新
- **WHEN** 用户在底部位置且流式数据更新
- **THEN** 自动调用 scrollToBottom

#### Scenario: 用户已向上滚动时不自动跟随
- **WHEN** 用户已向上滚动离开底部且流式数据更新
- **THEN** 不调用 scrollToBottom

### Requirement: 错误消息展示

当存在流式运行数据的错误消息时，Detail SHALL 显示错误 Alert。

#### Scenario: 有错误消息时显示 Alert
- **WHEN** runningChatData.errorMessage 存在
- **THEN** 渲染错误 Alert 组件

#### Scenario: 无错误消息时不显示 Alert
- **WHEN** runningChatData.errorMessage 不存在
- **THEN** 不渲染错误 Alert 组件

# Detail RunningChat Selector 优化

## Purpose

将 `Detail` 组件中的 `runningChat` selector 从订阅整个嵌套对象缩小为精确的 `chatId + modelId` 路径，消除其他聊天/模型的发送状态变化对本组件的干扰。

## Requirements

### Requirement: Detail 组件使用精确路径的 runningChat selector

系统 SHALL 将 `Detail` 组件中的 `runningChat` selector 从订阅整个嵌套对象缩小为 `state.chat.runningChat[selectedChat?.id]?.[chatModel.modelId]`。

#### Scenario: selector 仅订阅当前聊天的当前模型
- **WHEN** `Detail` 组件订阅 `runningChat` 数据
- **THEN** 使用 `state.chat.runningChat[selectedChat?.id]?.[chatModel.modelId]` 精确路径
- **AND** 仅当当前选中聊天的当前模型的运行数据变化时，selector 返回新引用
- **AND** 其他聊天或其他模型的发送状态变化不会触发本组件重渲染

### Requirement: ResizeObserver useEffect 依赖适配

系统 SHALL 更新 `ResizeObserver` 相关 `useEffect` 的依赖项。

#### Scenario: 依赖项使用精确数据
- **WHEN** `ResizeObserver` 相关的 `useEffect` 执行
- **THEN** 依赖数组使用 `runningChatData` 替代原来的 `runningChat`
- **AND** 语义不变——仍在运行数据变化时触发滚动状态检测

#### Scenario: 收窄后的行为变化
- **WHEN** 同一 chat 下其他 `modelId` 的数据变化
- **THEN** 不再触发 ResizeObserver 重连
- **AND** `ResizeObserver` 已通过监听 DOM 尺寸变化覆盖内容溢出检测场景

### Requirement: 错误信息展示适配

系统 SHALL 将错误信息展示从嵌套访问改为直接使用 `runningChatData`。

#### Scenario: 错误信息直接读取
- **WHEN** 需要展示运行错误信息
- **THEN** 使用 `runningChatData?.errorMessage` 直接读取
- **AND** 不再需要 `runningChat[selectedChat.id]?.[chatModel.modelId]?.errorMessage` 的嵌套访问

### Requirement: 边界情况安全处理

系统 SHALL 确保在各种边界情况下 selector 行为安全。

#### Scenario: selectedChat 为 null
- **WHEN** `selectedChat` 为 `null`
- **THEN** `undefined?.[modelId]` 安全返回 `undefined`，行为不变

#### Scenario: runningChat 数据不存在
- **WHEN** `runningChat[selectedChatId]` 不存在
- **THEN** 安全返回 `undefined`

#### Scenario: chatModel.modelId 不存在
- **WHEN** `chatModel.modelId` 为空
- **THEN** selector 返回 `undefined`，错误 Alert 不渲染

### Requirement: 现有测试同步更新

系统 SHALL 同步更新 Detail 相关测试中的 mock。

#### Scenario: 测试 mock 更新
- **WHEN** `ChatPanelContentDetail.test.tsx` 和 `ChatPanel.test.tsx` 执行
- **THEN** 测试中的 `runningChat` mock 数据需适配新的精确路径

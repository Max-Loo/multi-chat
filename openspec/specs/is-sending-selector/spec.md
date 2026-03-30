# useIsSending Selector 优化

## Purpose

将 `useIsSending` hook 中的 `runningChat` selector 从订阅整个嵌套对象缩小为当前选中聊天的路径，消除其他聊天的发送状态变化对 Detail 组件的间接重渲染影响。

## Requirements

### Requirement: useIsSending 使用精确路径的 selector

系统 SHALL 将 `useIsSending` 中的 `runningChat` selector 从订阅整个对象缩小为 `state.chat.runningChat[selectedChat?.id]`。

#### Scenario: 仅订阅当前选中聊天的运行数据
- **WHEN** `useIsSending` hook 执行
- **THEN** 使用 `useAppSelector(state => state.chat.runningChat[selectedChat?.id])` 替代订阅整个 `runningChat`
- **AND** 仅当当前选中聊天的运行数据变化时，selector 返回新引用
- **AND** 其他聊天的发送状态变化不会触发使用 `useIsSending` 的组件重渲染

### Requirement: useMemo 逻辑适配新的 selector 输出

系统 SHALL 更新 `isSending` 的 `useMemo` 逻辑以使用新的 `currentChatRunning` 变量。

#### Scenario: 计算当前聊天是否正在发送
- **WHEN** `useMemo` 计算 `isSending` 值
- **THEN** 使用 `currentChatRunning` 变量替代原来的 `runningChat[selectedChat.id]`
- **AND** `useMemo` 的依赖数组为 `[selectedChat, currentChatRunning]`

### Requirement: 边界情况安全处理

系统 SHALL 确保在各种边界情况下 hook 行为安全。

#### Scenario: selectedChat 为 null
- **WHEN** `selectedChat` 为 `null`
- **THEN** `state.chat.runningChat[undefined]` 返回 `undefined`
- **AND** `isNil(currentChatRunning)` 检查使 `isSending` 返回 `false`

#### Scenario: 当前聊天无运行数据
- **WHEN** 当前聊天没有任何运行数据
- **THEN** `currentChatRunning` 为 `undefined`
- **AND** `isNil` 检查使 `isSending` 返回 `false`

#### Scenario: selectedChat 切换
- **WHEN** `selectedChat` 切换到其他聊天
- **THEN** selector 路径自动切换
- **AND** `useMemo` 因依赖变化重新计算

### Requirement: 功能正确性保持

系统 SHALL 确保优化后功能行为不变。

#### Scenario: isSending 正确性
- **WHEN** 当前聊天有消息正在发送
- **THEN** `isSending` 正确返回 `true`

#### Scenario: 其他聊天发送不影响当前
- **WHEN** 其他聊天有消息发送
- **THEN** 使用 `useIsSending` 的组件不会因其他聊天的发送状态变化而重渲染

#### Scenario: 所有测试通过
- **WHEN** 执行所有现有测试
- **THEN** 全部通过

# ChatButton Selector 优化

## Purpose

将 `ChatButton` 组件内部的 `useAppSelector(selectedChatId)` 移除，改由父组件 `Sidebar` 订阅一次后通过 props 传入，消除 N 个子组件各自独立订阅全局状态导致的级联重渲染。

## Requirements

### Requirement: ChatButton 不再直接订阅 Redux 全局状态

系统 SHALL 确保每个 `ChatButton` 不再独立订阅 `selectedChatId`，改由父组件统一订阅后通过 props 传入。

#### Scenario: 移除 ChatButton 内部的 useAppSelector
- **WHEN** `ChatButton` 组件渲染
- **THEN** 内部不再包含任何 `useAppSelector` 调用
- **AND** 不再导入 `useAppSelector`

#### Scenario: 通过 isSelected props 控制选中状态
- **WHEN** `Sidebar` 渲染 `ChatButton` 列表
- **THEN** `Sidebar` 订阅 `selectedChatId` 一次
- **AND** 每个 `ChatButton` 通过 `isSelected={chat.id === selectedChatId}` props 接收选中状态

### Requirement: ChatButtonProps 接口包含 isSelected 字段

系统 SHALL 在 `ChatButtonProps` 接口中新增 `isSelected` 字段。

#### Scenario: ChatButtonProps 接口定义
- **WHEN** `ChatButtonProps` 接口被定义
- **THEN** 包含 `chat: Chat` 和 `isSelected: boolean` 字段

### Requirement: ChatButton 内部使用点全部改用 isSelected props

系统 SHALL 将 `ChatButton` 内部所有使用 `selectedChatId` 的位置替换为 `isSelected` props。

#### Scenario: 选中状态相关渲染使用 isSelected
- **WHEN** `ChatButton` 需要判断当前聊天是否被选中
- **THEN** 重命名视图背景样式、普通视图背景样式、删除回调中的判断均使用 `isSelected` props

### Requirement: memo 比较函数包含 isSelected

系统 SHALL 更新 `ChatButton` 的 `memo` 比较函数，将 `isSelected` 纳入比较范围。

#### Scenario: memo 比较函数更新
- **WHEN** `memo` 比较函数执行
- **THEN** 同时比较 `chat.id`、`chat.name` 和 `isSelected`
- **AND** 任一值变化时返回 `false`（触发重渲染），全部相同时返回 `true`

### Requirement: 现有测试同步更新

系统 SHALL 同步更新 ChatButton 相关测试，使用 `isSelected` props 控制选中状态。

#### Scenario: 测试中使用 isSelected props
- **WHEN** `ChatButton.test.tsx` 中的 `renderChatButton` 辅助函数被调用
- **THEN** 需传入 `isSelected` 参数
- **AND** store 中的 `selectedChatId` 对 `ChatButton` 不再生效
- **AND** 选中状态完全由 `isSelected` props 控制

#### Scenario: 功能行为不变
- **WHEN** 所有测试执行
- **THEN** 选中高亮、删除后清除 URL 参数、重命名时背景样式等行为均正常

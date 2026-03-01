# Spec: Chat Panel Hooks Testing

本规格定义了聊天面板相关自定义 Hooks 的测试要求，确保状态管理和业务逻辑的正确性。

## Purpose

确保聊天面板相关的自定义 Hooks（useIsChatSending、useTypedSelectedChat 等）具有完整的单元测试覆盖，验证状态追踪、性能优化和类型安全的正确性。

## Requirements

### Requirement: useIsChatSending Hook
系统 SHALL 提供一个自定义 Hook，用于判断当前选中的聊天是否处于消息发送状态。

#### Scenario: 单个聊天发送中
- **WHEN** 选中的聊天 ID 存在于 runningChat 状态中
- **AND** 该聊天的某个模型正在发送消息（isSending=true）
- **THEN** Hook 应返回 { isSending: true }

#### Scenario: 多个聊天部分发送中
- **WHEN** runningChat 包含 3 个聊天，其中 2 个正在发送
- **AND** 当前选中的聊天是发送中的之一
- **THEN** Hook 应返回 { isSending: true }

#### Scenario: 当前聊天未发送
- **WHEN** runningChat 状态中不存在当前选中的聊天 ID
- **THEN** Hook 应返回 { isSending: false }

#### Scenario: 所有模型完成发送
- **WHEN** 当前聊天存在 runningChat 状态中
- **AND** 所有模型的 isSending 均为 false
- **THEN** Hook 应返回 { isSending: false }

#### Scenario: runningChat 为空
- **WHEN** runningChat 状态为空对象
- **THEN** Hook 应返回 { isSending: false }

---

### Requirement: useTypedSelectedChat Hook
系统 SHALL 提供一个自定义 Hook，用于获取类型安全的选中聊天和其关联的模型列表。

#### Scenario: 获取有效的选中聊天
- **WHEN** Redux state 中存在有效的 selectedChat
- **THEN** Hook 应返回 { selectedChat: Chat, chatModelList: ChatModel[] }
- **AND** selectedChat 应排除 null/undefined 类型

#### Scenario: 获取空的模型列表
- **WHEN** selectedChat 存在但 chatModelList 为 undefined
- **THEN** Hook 应返回 { chatModelList: [] }
- **AND** 不应抛出错误

#### Scenario: 包含模型的聊天
- **WHEN** selectedChat 包含 3 个模型配置
- **THEN** Hook 应返回 chatModelList 数组，长度为 3
- **AND** 每个 ChatModel 应包含 modelId、modelName 等字段

#### Scenario: 选中聊天未定义时的默认行为
- **WHEN** selectedChat 为 undefined（初始加载状态）
- **THEN** Hook 应将 selectedChat 类型断言为 Chat
- **AND** 应返回 chatModelList 为空数组

---

### Requirement: Hook 的依赖追踪和性能
系统 SHALL 确保 Hooks 正确追踪依赖并避免不必要的重新渲染。

#### Scenario: useIsChatSending 依赖变化
- **WHEN** selectedChat.id 或 runningChat 状态发生变化
- **THEN** Hook 应重新计算 isSending 值
- **AND** 应使用 useMemo 缓存计算结果

#### Scenario: useTypedSelectedChat 依赖变化
- **WHEN** selectedChat 对象引用发生变化
- **THEN** Hook 应重新计算 typedSelectedChat
- **AND** 应重新计算 chatModelList

#### Scenario: useTypedSelectedChat chatModelList 缓存
- **WHEN** typedSelectedChat 未变化但其他 Redux state 变化
- **THEN** Hook 应返回缓存的 chatModelList
- **AND** 不应重新创建空数组

---

### Requirement: Hook 的错误处理
系统 SHALL 能够优雅处理异常状态，不抛出运行时错误。

#### Scenario: selectedChat 为 null
- **WHEN** useTypedSelectedChat 接收到 null 作为 selectedChat
- **THEN** Hook 应将 null 断言为 Chat 类型（TypeScript 类型断言）
- **AND** 不应在运行时抛出错误

#### Scenario: runningChat 数据结构异常
- **WHEN** runningChat 包含非预期的数据结构
- **THEN** useIsChatSending 应返回 isSending: false
- **AND** 不应导致应用崩溃

---

### Requirement: Hook 与 Redux 集成
系统 SHALL 通过 useAppSelector 正确连接 Redux store。

#### Scenario: useIsChatSending 订阅 runningChat
- **WHEN** Hook 被调用
- **THEN** 应使用 useAppSelector(state => state.chat.runningChat) 订阅状态
- **AND** 应使用 useTypedSelectedChat 获取 selectedChat

#### Scenario: useTypedSelectedChat 使用现有 Hook
- **WHEN** Hook 被调用
- **THEN** 应调用 useCurrentSelectedChat 获取原始数据
- **AND** 应在此基础上提供类型断言和数据转换

# Middleware 测试规格

本规格定义了 `chatMiddleware.ts` 和 `modelMiddleware.ts` 模块的单元测试要求，确保 Listener Middleware 正确监听 action 并触发数据持久化。

## ADDED Requirements

### Requirement: 测试 Model Middleware 触发条件
系统应当测试 `saveModelsMiddleware` 在匹配特定 action 时触发保存逻辑。

#### Scenario: 创建模型时触发保存
- **WHEN** dispatch `createModel` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveModelsToJson` 并传入最新的 models 数组

#### Scenario: 编辑模型时触发保存
- **WHEN** dispatch `editModel` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveModelsToJson` 并传入最新的 models 数组

#### Scenario: 删除模型时触发保存
- **WHEN** dispatch `deleteModel` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveModelsToJson` 并传入最新的 models 数组

#### Scenario: 不匹配的 action 不触发保存
- **WHEN** dispatch 非 model 相关的 action
- **THEN** middleware 忽略该 action
- **AND** 不调用 `saveModelsToJson`

### Requirement: 测试 Chat Middleware 触发条件
系统应当测试 `saveChatListMiddleware` 在匹配特定 action 时触发保存逻辑。

#### Scenario: 聊天消息发送成功时触发保存
- **WHEN** dispatch `startSendChatMessage.fulfilled` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

#### Scenario: 聊天消息发送失败时触发保存
- **WHEN** dispatch `startSendChatMessage.rejected` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

#### Scenario: 创建聊天时触发保存
- **WHEN** dispatch `createChat` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

#### Scenario: 编辑聊天时触发保存
- **WHEN** dispatch `editChat` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

#### Scenario: 编辑聊天名称时触发保存
- **WHEN** dispatch `editChatName` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

#### Scenario: 删除聊天时触发保存
- **WHEN** dispatch `deleteChat` action
- **THEN** middleware 监听到该 action
- **AND** 调用 `saveChatsToJson` 并传入最新的 chatList 数组

### Requirement: 测试 Middleware 从 Store 获取最新状态
系统应当验证 middleware 的 effect 函数正确从 `listenerApi.getState()` 获取最新状态。

#### Scenario: Model Middleware 获取最新 models
- **WHEN** middleware effect 函数执行
- **THEN** 从 store 获取 `state.models.models`
- **AND** 传递给 `saveModelsToJson` 的是更新后的数组

#### Scenario: Chat Middleware 获取最新 chatList
- **WHEN** middleware effect 函数执行
- **THEN** 从 store 获取 `state.chat.chatList`
- **AND** 传递给 `saveChatsToJson` 的是更新后的数组

### Requirement: 测试 Mock 存储层依赖
系统应当正确 Mock 存储层函数以隔离 middleware 逻辑测试。

#### Scenario: Mock saveModelsToJson
- **WHEN** 测试 Model Middleware
- **THEN** Mock `saveModelsToJson` 验证调用次数和参数
- **AND** Mock 返回 resolved Promise

#### Scenario: Mock saveChatsToJson
- **WHEN** 测试 Chat Middleware
- **THEN** Mock `saveChatsToJson` 验证调用次数和参数
- **AND** Mock 返回 resolved Promise

### Requirement: 测试 Middleware 异步处理
系统应当验证 middleware 的 effect 函数正确处理异步保存操作。

#### Scenario: Effect 函数等待保存完成
- **WHEN** action 触发 middleware
- **THEN** effect 函数使用 `async` 关键字
- **AND** 等待 `saveModelsToJson` 或 `saveChatsToJson` 完成

#### Scenario: 保存失败不影响 Redux 流程
- **WHEN** `saveModelsToJson` 或 `saveChatsToJson` 抛出错误
- **THEN** middleware effect 捕获错误
- **AND** 不阻塞 Redux action 的正常处理

### Requirement: 测试 Matcher 函数
系统应当测试 `isAnyOf` matcher 正确匹配多个 action 类型。

#### Scenario: Model Matcher 匹配所有模型操作
- **WHEN** dispatch `createModel`、`editModel` 或 `deleteModel`
- **THEN** matcher 返回 true
- **AND** 触发 middleware effect

#### Scenario: Chat Matcher 匹配所有聊天操作
- **WHEN** dispatch 任何 chat 相关的 action（包括 fulfilled 和 rejected）
- **THEN** matcher 返回 true
- **AND** 触发 middleware effect

### Requirement: 测试 Middleware 注册和初始化
系统应当验证 middleware 正确注册到 Redux store。

#### Scenario: Model Middleware 已注册
- **WHEN** Redux store 创建时
- **THEN** `saveModelsMiddleware` middleware 被添加到 middleware 链
- **AND** startListening 已被调用

#### Scenario: Chat Middleware 已注册
- **WHEN** Redux store 创建时
- **THEN** `saveChatListMiddleware` middleware 被添加到 middleware 链
- **AND** startListening 已被调用

### Requirement: 测试 Middleware 持久化顺序
系统应当验证在多个同步 action 触发时，middleware 按照预期顺序执行。

#### Scenario: 连续触发多次保存
- **WHEN** 短时间内 dispatch 多个匹配的 action
- **THEN** 每次触发都调用保存函数
- **AND** 保存顺序与 action dispatch 顺序一致

# Chat Message Sending Capability Specification

## ADDED Requirements

### Requirement: 发送聊天消息

系统 MUST 在 Redux Thunk `sendMessage` 中使用 `ChatService.streamChatCompletion()` 发起流式聊天请求。

系统 MUST 将 `model` 对象、`historyList` 和 `message` 作为参数传递给 `ChatService.streamChatCompletion()`。

系统 MUST 将 `signal`（AbortSignal）作为选项传递给 `ChatService.streamChatCompletion()`。

系统 MUST 使用 `for await...of` 循环迭代 `ChatService.streamChatCompletion()` 返回的异步生成器。

系统 MUST NOT 再使用 `getProviderFactory(model.providerKey).getModelProvider().fetchApi.fetch()` 发起聊天请求。

系统 MUST NOT 再通过 Provider 工厂获取 `fetchApi` 实例。

#### Scenario: 使用 ChatService 发送聊天消息
- **WHEN** 用户在聊天界面发送消息
- **AND** Redux Thunk `sendMessage` 被 dispatch
- **THEN** 系统调用 `ChatService.streamChatCompletion({ model, historyList, message }, { signal })`
- **AND** 系统通过 `for await (const msg of response)` 迭代流式响应
- **AND** 系统将每个响应消息 dispatch 到 Redux store
- **AND** 聊天界面实时显示流式响应

#### Scenario: 不再使用 Provider 工厂的 fetchApi
- **WHEN** Redux Thunk `sendMessage` 执行
- **THEN** 系统 MUST NOT 调用 `getProviderFactory(model.providerKey).getModelProvider()`
- **AND** 系统 MUST NOT 访问 `fetchApi.fetch()` 方法
- **AND** 系统 MUST NOT 通过 Provider 架构发起聊天请求
- **AND** 所有聊天请求逻辑由 `ChatService` 处理

---

### Requirement: 处理流式响应

系统 MUST 在 `for await...of` 循环中处理 `ChatService.streamChatCompletion()` 返回的 `StandardMessage` 对象。

系统 MUST 将每个 `StandardMessage` 对象转换为 Redux action 并 dispatch。

系统 MUST 在响应完成时（`finishReason` 不为 `null`）更新 Redux state 中的消息状态。

系统 MUST 在信号中断时（`signal.aborted === true`）停止处理流式响应。

#### Scenario: 处理流式响应消息
- **WHEN** `ChatService.streamChatCompletion()` 返回流式响应
- **AND** 第 1 个响应消息包含 `{ content: "Hello", finishReason: null }`
- **AND** 第 2 个响应消息包含 `{ content: "Hello World", finishReason: null }`
- **AND** 第 3 个响应消息包含 `{ content: "Hello World!", finishReason: "stop" }`
- **THEN** Redux Thunk dispatch 3 个 actions，每个 action 包含对应的消息内容
- **AND** 聊天界面逐步显示 "Hello" → "Hello World" → "Hello World!"
- **AND** 最后一个消息的 `finishReason` 为 "stop"

#### Scenario: 信号中断时停止处理
- **WHEN** 用户在流式响应过程中点击"停止生成"按钮
- **AND** Redux Thunk 调用 `signal.abort()`
- **THEN** `ChatService.streamChatCompletion()` 检测到信号中断
- **AND** 流式响应生成器停止生成新消息
- **AND** `for await...of` 循环退出
- **AND** Redux state 中的消息状态更新为"已停止"

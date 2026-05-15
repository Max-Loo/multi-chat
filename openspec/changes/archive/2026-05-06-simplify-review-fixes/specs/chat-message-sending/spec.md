## MODIFIED Requirements

### Requirement: 发送聊天消息

系统 MUST 在 Redux Thunk `sendMessage` 中使用 `ChatService.streamChatCompletion()` 发起流式聊天请求。前端 `sendMessage` 调用函数 SHALL 在调用点添加异步异常处理（`.catch(console.error)`）。并发守卫由调用点的 `isSending` 检查负责，SHALL NOT 使用 `abortSendEventRef.current` 作为发送锁。

#### Scenario: 使用 ChatService 发送聊天消息
- **WHEN** 用户在聊天界面发送消息
- **AND** Redux Thunk `sendMessage` 被 dispatch
- **THEN** 系统调用 `ChatService.streamChatCompletion({ model, historyList, message }, { signal })`
- **AND** 系统通过 `for await (const msg of response)` 迭代流式响应
- **AND** 系统将每个响应消息 dispatch 到 Redux store

#### Scenario: 前端 sendMessage 异步异常捕获
- **WHEN** 前端 `sendMessage` 的 async 流程中抛出异常
- **THEN** 调用点 SHALL 通过 `.catch(console.error)` 捕获，避免 unhandled rejection

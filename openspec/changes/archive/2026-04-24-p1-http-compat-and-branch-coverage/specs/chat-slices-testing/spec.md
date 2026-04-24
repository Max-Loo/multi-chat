## MODIFIED Requirements

### Requirement: 异步 thunk 错误分支覆盖
测试 SHALL 覆盖 chatSlice 异步 thunk（发送消息、加载历史等）的错误处理分支。

#### Scenario: 发送消息网络失败
- **WHEN** 聊天服务 `sendMessage` 抛出网络错误
- **THEN** store 状态包含错误信息，`isSending` 恢复为 false

#### Scenario: 加载历史记录失败
- **WHEN** 聊天服务 `loadHistory` 抛出异常
- **THEN** store 状态包含错误信息，加载状态恢复

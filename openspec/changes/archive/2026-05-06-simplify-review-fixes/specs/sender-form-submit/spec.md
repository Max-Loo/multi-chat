## MODIFIED Requirements

### Requirement: Sender 表单禁止浏览器默认提交行为

Sender 组件的 `<form>` 元素 SHALL 在 `onSubmit` 事件中调用 `preventDefault()`，阻止浏览器默认的表单提交行为（页面刷新）。`sendMessage` 函数改为异步后 SHALL 在调用点添加异常处理。并发发送守卫已由调用点（`onClickSendBtn`、`onPressEnterBtn`）的 `isSending` 检查覆盖，SHALL NOT 使用 `abortSendEventRef.current` 作为发送锁（该 ref 在发送完成后不清空，用作锁会导致后续发送永久失效）。

#### Scenario: 点击发送按钮不触发页面刷新
- **WHEN** 用户在 Sender 表单内点击发送按钮
- **THEN** 表单的 `onSubmit` 事件处理器调用 `e.preventDefault()`，浏览器不执行页面刷新，仅执行 `sendMessage` 逻辑

#### Scenario: 在输入框按 Enter 发送不触发页面刷新
- **WHEN** 用户在 Textarea 中按下 Enter 键触发发送
- **THEN** 表单不执行默认提交行为，仅执行 `sendMessage` 逻辑

#### Scenario: 并发发送由调用点守卫阻止
- **WHEN** 用户在消息发送过程中（`isSending` 为 true）再次点击发送或按 Enter
- **THEN** `onClickSendBtn` 和 `onPressEnterBtn` 中的 `isSending` 检查 SHALL 阻止调用 `sendMessage`

#### Scenario: 异步发送异常被捕获
- **WHEN** `sendMessage` 内部 `dispatch(startSendChatMessage(...))` 抛出未预期异常
- **THEN** 调用点 SHALL 通过 `.catch()` 捕获异常，避免 unhandled promise rejection

## MODIFIED Requirements

### Requirement: scrollToBottom 引用稳定
`scrollToBottom` 的 `useCallback` 依赖必须为空数组，通过 `displayLengthRef` 读取当前合并列表（含流式消息）的长度，确保流式和非流式场景下 `scrollToIndex` 都能精确到达真正的底部。

#### Scenario: 流式期间点击滚动到底部按钮
- **WHEN** 流式消息正在生成，用户点击「滚动到底部」按钮
- **THEN** `scrollToBottom` SHALL 通过 `displayLengthRef` 获取包含流式消息的列表长度，调用 `scrollToIndex` 精确到达内容底部

#### Scenario: 非流式期间点击滚动到底部按钮
- **WHEN** 没有流式消息，用户点击「滚动到底部」按钮
- **THEN** `scrollToBottom` SHALL 通过 `displayLengthRef` 获取历史列表长度，调用 `scrollToIndex` 到达底部

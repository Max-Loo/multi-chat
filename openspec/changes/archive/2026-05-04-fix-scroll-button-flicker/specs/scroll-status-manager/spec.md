## MODIFIED Requirements

### Requirement: 底部检测必须使用单一数据源
底部检测必须使用单一数据源（`isAtBottom` state + `isAtBottomRef` 镜像），禁止存在语义重复的独立 ref。流式自动跟随期间，SHALL 通过 `isStreamingRef` 保护 `isAtBottom` 状态不被中间态干扰：当 `isStreamingRef.current === true` 且 `isAtBottomRef.current === true` 时，`checkScrollStatus` SHALL 跳过 `isAtBottom` 的检测，直接保持 `true`。

#### Scenario: 流式响应期间按钮不闪现
- **WHEN** AI 正在流式生成消息，用户原本处于底部（isAtBottom 为 true），流式 chunk 持续到达
- **THEN** `isAtBottom` SHALL 在整个流式过程中保持 `true`，「滚动到底部」按钮 SHALL NOT 出现

#### Scenario: 流式期间用户主动上滚
- **WHEN** AI 正在流式生成消息，用户主动向上滚动离开底部
- **THEN** `isStreamingRef` SHALL 立即重置为 `false`，`isAtBottom` SHALL 变为 `false`，按钮正常显示

#### Scenario: 流式结束后恢复正常检测
- **WHEN** 流式生成结束（runningChatData 变为 undefined 或 isSending 为 false）
- **THEN** `isStreamingRef` SHALL 重置为 `false`，恢复正常滚动状态检测

#### Scenario: auto-scroll 完成后恢复正常检测
- **WHEN** 流式自动跟随触发 scrollToBottom，Virtualizer 完成滚动后触发 onScroll 回调
- **THEN** `isStreamingRef` SHALL 在确认到达底部后重置为 `false`

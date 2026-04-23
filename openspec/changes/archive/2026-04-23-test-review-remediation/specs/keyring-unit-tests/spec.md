## ADDED Requirements

### Requirement: 跳过用例注释规范化
keyring 测试中因 Web Crypto API mock 限制而跳过的用例 SHALL 保留 skip 状态并补充详细的跳过原因注释。

#### Scenario: 解密失败测试注释规范
- **WHEN** 测试因 Web Crypto API mock 在 Vitest/happy-dom 环境中不可靠而跳过
- **THEN** skip 注释 SHALL 说明：具体的环境限制、已验证的替代方式、解除条件

### Requirement: 消息发送失败时触发保存
`chatMiddleware.test.ts` 中的跳过用例 SHALL 被修复为可执行的测试，通过构造完整的 `state.runningChat` 结构来验证消息发送失败时的保存行为。

#### Scenario: 消息发送失败触发保存
- **WHEN** `startSendChatMessage.rejected` 被分发
- **AND** state 中包含完整的 `runningChat[chat.id]` 结构
- **THEN** middleware SHALL 调用 `saveChatsToJson` 保存当前状态

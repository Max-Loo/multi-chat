# Purpose

补充现有测试文件中缺失的测试用例，覆盖自动命名触发逻辑、provider 错误处理、Hook 状态更新和配置持久化等场景。

## Requirements

### Requirement: useIsChatSending 最后一个测试用例完整
系统 SHALL 在 `useIsChatSending.test.ts` 中补全最后的测试用例，验证 isSending 状态随 runningChat 变化而更新。

#### Scenario: runningChat 状态变化时 isSending 正确反映
- **WHEN** store 中 currentChatRunning 状态从 false 变为 true
- **THEN** `isSending` 从 `false` 变为 `true`

### Requirement: chatMiddleware 自动命名触发逻辑被测试
系统 SHALL 在 `chatMiddleware.test.ts` 中补充自动命名相关的 listener 逻辑测试。该 listener 监听 `'chatModel/sendMessage/fulfilled'` action type，且需同时满足 4 个前置条件才触发：非手动命名（`isManuallyNamed !== true`）、全局开关已开启（`autoNamingEnabled === true`）、聊天标题为空（`name === '' || name === undefined`）、对话历史长度恰好为 2（第一条用户消息 + 第一条 AI 回复）。另有内存锁 `generatingTitleChatIds` 防止并发重复生成。

#### Scenario: 四个条件全部满足时触发 generateChatName
- **WHEN** dispatch `'chatModel/sendMessage/fulfilled'` action 且聊天为非手动命名、全局开关开启、标题为空、对话历史长度为 2
- **THEN** `generateChatName` thunk 被 dispatch

#### Scenario: 手动命名的聊天不触发自动命名
- **WHEN** dispatch `'chatModel/sendMessage/fulfilled'` action 且聊天 `isManuallyNamed === true`
- **THEN** `generateChatName` thunk 不被 dispatch

#### Scenario: 全局开关关闭时不触发
- **WHEN** dispatch `'chatModel/sendMessage/fulfilled'` action 且 `autoNamingEnabled === false`
- **THEN** `generateChatName` thunk 不被 dispatch

#### Scenario: 标题非空时不触发
- **WHEN** dispatch `'chatModel/sendMessage/fulfilled'` action 且聊天已有标题
- **THEN** `generateChatName` thunk 不被 dispatch

#### Scenario: 对话历史长度不等于 2 时不触发
- **WHEN** dispatch `'chatModel/sendMessage/fulfilled'` action 且对话历史长度为 1 或 3
- **THEN** `generateChatName` thunk 不被 dispatch

#### Scenario: 内存锁防止并发重复触发
- **WHEN** 同一聊天 ID 已在 `generatingTitleChatIds` 中时 dispatch `'chatModel/sendMessage/fulfilled'`
- **THEN** `generateChatName` thunk 不被 dispatch

#### Scenario: fulfilled/rejected 后内存锁被释放
- **WHEN** `generateChatName.fulfilled` 或 `generateChatName.rejected` action 被 dispatch
- **THEN** 对应聊天 ID 从 `generatingTitleChatIds` 中移除

### Requirement: providerFactory 错误处理被测试
系统 SHALL 在 `providerFactory.test.ts` 中补充错误处理场景测试。

#### Scenario: 无效 providerKey 抛出包含 key 信息的增强错误
- **WHEN** 调用 `getProvider('invalid-provider' as any, 'key', 'url')`
- **THEN** 抛出 Error，且 error.message 包含 `Failed to initialize provider "invalid-provider"` 字样，error.cause 为原始错误

#### Scenario: SDK 加载失败时抛出增强错误
- **WHEN** `loadProvider` 抛出网络错误
- **THEN** 抛出 Error，且 error.message 包含 `Please check your network connection` 字样

#### Scenario: 空 API key 场景
- **WHEN** 调用 `getProvider('deepseek', '', 'url')`
- **THEN** 仍能创建 provider 实例（空 key 由 provider SDK 自身校验）

### Requirement: appConfigMiddleware setAutoNamingEnabled 持久化被测试
系统 SHALL 在 `appConfigMiddleware.test.ts` 中补充 `setAutoNamingEnabled` action 触发 localStorage 持久化的测试。

#### Scenario: 启用自动命名时持久化到 localStorage
- **WHEN** dispatch `setAutoNamingEnabled(true)`
- **THEN** `localStorage.setItem` 被调用且值为 `'true'`

#### Scenario: 禁用自动命名时持久化到 localStorage
- **WHEN** dispatch `setAutoNamingEnabled(false)`
- **THEN** `localStorage.setItem` 被调用且值为 `'false'`

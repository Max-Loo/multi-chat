## ADDED Requirements

### Requirement: streamChatCompletion MetadataCollectionError 降级路径测试

系统 SHALL 为 `src/services/chat/index.ts` 中的 `streamChatCompletion` 函数添加 MetadataCollectionError 捕获路径的测试。

当 `processStreamEvents` 抛出 `MetadataCollectionError` 时，函数 SHALL 优雅降级（console.warn + return），不向调用方抛出错误。

#### Scenario: MetadataCollectionError 被捕获时优雅降级
- **WHEN** `streamChatCompletion` 的 `processStreamEvents` 抛出 `MetadataCollectionError`
- **THEN** 函数 SHALL 正常返回（不抛出错误），且调用 `console.warn` 记录降级信息

#### Scenario: 非 MetadataCollectionError 被正常抛出
- **WHEN** `streamChatCompletion` 的 `processStreamEvents` 抛出非 MetadataCollectionError 类型的错误（如 TypeError）
- **THEN** 函数 SHALL 将错误原样抛出给调用方

### Requirement: chatSlices sendMessage pending re-entry 分支测试

系统 SHALL 为 `sendMessage.pending` 的 re-entry 路径（runningChat 中已存在同一 modelId）添加测试。

#### Scenario: 同一模型重复发送时重置状态
- **WHEN** `sendMessage.pending` 被 dispatch，且 `runningChat[chatId][modelId]` 已存在
- **THEN** SHALL 将 `isSending` 重置为 `true`，`errorMessage` 重置为空字符串，保留 `history` 不变

### Requirement: chatSlices sendMessage fulfilled appendHistory 失败路径测试

系统 SHALL 为 `sendMessage.fulfilled` 中 `appendHistoryToModel` 返回 `false` 的分支添加测试。

#### Scenario: appendHistoryToModel 失败时跳过清理
- **WHEN** `sendMessage.fulfilled` 的 `appendHistoryToModel` 返回 `false`（聊天不在 activeChatData 中）
- **THEN** SHALL 不清理 `runningChat[chatId][modelId]`，保留错误现场供排查

### Requirement: chatSlices generateChatName fulfilled null payload 和 activeChat 未加载分支测试

系统 SHALL 为 `generateChatName.fulfilled` 的 null payload、metaIdx 未找到、activeChat 未加载三个分支添加测试。

#### Scenario: payload 为 null 时静默返回
- **WHEN** `generateChatName.fulfilled` 收到 `null` payload
- **THEN** SHALL 不更新任何 state

#### Scenario: chatId 不在 chatMetaList 中时跳过更新
- **WHEN** `generateChatName.fulfilled` 的 `chatId` 不存在于 `chatMetaList`
- **THEN** SHALL 不更新 chatMetaList，不抛出错误

#### Scenario: chatId 不在 activeChatData 中时跳过 activeChat 更新
- **WHEN** `generateChatName.fulfilled` 的 `chatId` 存在于 chatMetaList 但不存在于 activeChatData
- **THEN** SHALL 更新 chatMetaList 中的名称，但不更新 activeChatData

### Requirement: chatSlices setSelectedChatIdWithPreload fulfilled 前一个聊天清理组合测试

系统 SHALL 为 `setSelectedChatIdWithPreload.fulfilled` 中清理前一个聊天的分支组合添加测试。

#### Scenario: 前一个聊天存在且未在发送时清理
- **WHEN** 切换到新聊天，且前一个聊天不在 `sendingChatIds` 中
- **THEN** SHALL 从 `activeChatData` 中删除前一个聊天的数据

#### Scenario: 前一个聊天正在发送时保留
- **WHEN** 切换到新聊天，且前一个聊天在 `sendingChatIds` 中
- **THEN** SHALL 保留前一个聊天的 `activeChatData`

#### Scenario: 没有前一个聊天时跳过清理
- **WHEN** 切换到新聊天，且之前没有选中的聊天（selectedChatId 为 null）
- **THEN** SHALL 不执行任何清理操作

### Requirement: chatSlices editChatName 超长截断测试

系统 SHALL 为 `editChatName` 的超长名称截断分支添加测试。

#### Scenario: 超过 20 个字符的名称被截断
- **WHEN** `editChatName` 收到超过 20 个字符的名称
- **THEN** SHALL 将名称截断为前 20 个字符

### Requirement: chatSlices deleteChat 正在发送时跳过测试

系统 SHALL 为 `deleteChat` 的正在发送检查分支添加测试。

#### Scenario: 正在发送的聊天不可删除
- **WHEN** `deleteChat` 被 dispatch，且该聊天在 `sendingChatIds` 中
- **THEN** SHALL 不删除聊天，chatMetaList 和 activeChatData 保持不变

### Requirement: chatSlices clearActiveChatData 正在发送时跳过测试

系统 SHALL 为 `clearActiveChatData` 的正在发送检查分支添加测试。

#### Scenario: 正在发送的聊天不可清理
- **WHEN** `clearActiveChatData` 被 dispatch，且该聊天在 `sendingChatIds` 中
- **THEN** SHALL 不清理该聊天的 activeChatData

### Requirement: providerLoader 网络恢复分支测试

系统 SHALL 为 `providerLoader.ts` 中 `handleNetworkRecover` 方法的触发添加测试。

#### Scenario: 网络恢复时自动重试加载
- **WHEN** 触发 `window` 的 `online` 事件
- **THEN** SHALL 调用 `preloadProviders` 重新加载所有已注册的供应商 SDK

### Requirement: 条件渲染组件分支测试

系统 SHALL 为分支覆盖率低于 60% 的条件渲染组件添加分支覆盖测试。

#### Scenario: NoProvidersAvailable 不同 provider 状态渲染
- **WHEN** NoProvidersAvailable 组件在无 providers 状态下渲染
- **THEN** SHALL 显示引导用户添加 provider 的内容

#### Scenario: FatalErrorScreen 不同错误类型渲染
- **WHEN** FatalErrorScreen 组件收到不同类型的错误对象
- **THEN** SHALL 显示对应的错误信息，且重置按钮可触发回调

#### Scenario: MobileDrawer 开关状态切换
- **WHEN** MobileDrawer 的 open 属性从 false 变为 true
- **THEN** SHALL 渲染抽屉内容

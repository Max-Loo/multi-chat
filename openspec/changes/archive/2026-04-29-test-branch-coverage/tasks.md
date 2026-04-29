## 1. 服务层 error path 补强

- [x] 1.1 为 `src/services/chat/index.ts` 添加 MetadataCollectionError 捕获测试：mock `processStreamEvents` 抛出 MetadataCollectionError，验证函数优雅返回且 console.warn 被调用
- [x] 1.2 为 `src/services/chat/index.ts` 添加非 MetadataCollectionError rethrow 测试：mock `processStreamEvents` 抛出 TypeError，验证错误被原样抛出

## 2. chatSlices extraReducers 分支补强

- [x] 2.1 添加 `sendMessage.pending` re-entry 测试：先 dispatch pending，再对同一 modelId dispatch pending，验证 isSending 被重置为 true、errorMessage 被清空
- [x] 2.2 添加 `sendMessage.fulfilled` appendHistoryToModel 失败测试：fulfilled 时 chat 不在 activeChatData 中，验证 runningChat 未被清理
- [x] 2.3 添加 `generateChatName.fulfilled` null payload 测试：验证 state 不变
- [x] 2.4 添加 `generateChatName.fulfilled` metaIdx 未找到测试：传入不存在的 chatId，验证 chatMetaList 不变
- [x] 2.5 添加 `generateChatName.fulfilled` activeChat 未加载测试：chatId 在 chatMetaList 但不在 activeChatData，验证 chatMetaList 更新但 activeChatData 不变
- [x] 2.6 添加 `setSelectedChatIdWithPreload.fulfilled` 前一个聊天未发送时清理测试：验证 previousChatId 的 activeChatData 被删除
- [x] 2.7 添加 `setSelectedChatIdWithPreload.fulfilled` 前一个聊天正在发送时保留测试：验证 previousChatId 的 activeChatData 保留
- [x] 2.8 添加 `setSelectedChatIdWithPreload.fulfilled` 无前一个聊天时跳过清理测试：selectedChatId 为 null，验证无清理操作

## 3. chatSlices reducer 边界分支补强

- [x] 3.1 添加 `editChatName` 超长名称截断测试：传入 20+ 字符名称，验证截断为前 20 字符
- [x] 3.2 添加 `deleteChat` 正在发送时跳过测试：先设 sendingChatIds，再 dispatch deleteChat，验证 chatMetaList 不变
- [x] 3.3 添加 `clearActiveChatData` 正在发送时跳过测试：先设 sendingChatIds，再 dispatch clearActiveChatData，验证 activeChatData 保留

## 4. providerLoader 网络恢复分支补强

- [x] 4.1 添加 window online 事件触发 handleNetworkRecover 测试：触发 online 事件，验证 preloadProviders 被调用且传入所有已注册的 providerKeys

## 5. 条件渲染组件分支补强

- [x] 5.1 为 NoProvidersAvailable 添加无 providers 状态渲染测试：验证引导内容显示
- [x] 5.2 为 FatalErrorScreen 添加不同错误类型渲染测试：验证错误信息显示和 reset 回调触发
- [x] 5.3 为 MobileDrawer 添加 open/close 状态切换测试：验证抽屉内容在 open=true 时渲染

## 6. 验证

- [x] 6.1 运行 `pnpm test:run` 确认所有新增测试通过
- [x] 6.2 运行 `pnpm test:coverage` 确认分支覆盖率提升到 82%+

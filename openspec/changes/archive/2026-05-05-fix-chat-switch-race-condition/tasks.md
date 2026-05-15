## 1. 消除竞态：移除 chatMetaList 依赖

- [x] 1.1 修改 `src/pages/Chat/index.tsx`：从 useEffect 依赖数组中移除 `chatMetaList`，但**保留函数体中的存在性检查**（`chatMetaList.find()`）。`loading` 仍在依赖数组中，当 loading 变为 false 时 useEffect 触发，此时 chatMetaList 已是加载后的最新值，find 检查可正确判断聊天是否存在。不存在的聊天调用 `clearChatIdParam()` 清除 URL，防止 `loadChatById` 加载已软删除的聊天数据。添加 `// eslint-disable-next-line react-hooks/exhaustive-deps` 注释抑制 lint 警告

## 2. 补充删除聊天的 URL 清理

- [x] 2.1 修改 `src/store/middleware/chatMiddleware.ts`：在 `deleteChat` effect 中，通过 `listenerApi.getState()` 检查 `state.chat.selectedChatId` 是否与被删除聊天的 ID 匹配，匹配时通过 `window.history.replaceState` 清除 URL 中的 `chatId` 参数（防御性兜底，ChatButton 组件已有清理逻辑，中间件覆盖其他可能的 deleteChat 调用入口）

## 3. 验证

- [x] 3.1 手动测试：在已有模型的聊天页面点击"新建聊天"，验证 Content 展示 ModelSelect 而非 Placeholder
- [x] 3.2 手动测试：正常切换聊天（A → B），验证旧聊天 A 的 activeChatData 仍被正确清理
- [x] 3.3 手动测试：删除当前查看的聊天，验证 URL 参数被清除且展示 Placeholder

## 1. chatHistoryHelper 重复模式提取与 Immer 优化

- [x] 1.1 提取 `resolveTargetIndex(content, historyIndex?)` 私有辅助函数，计算 clamp 后的目标索引
- [x] 1.2 `commitEdit` 中对 Immer draft 的 content 数组使用 `.push()` 替代 `pushContent` 创建新数组
- [x] 1.3 `commitRegenerate` 使用 `resolveTargetIndex` + Immer draft 直接索引赋值替代 `[...arr]` 拷贝模式（content + reasoningContent）
- [x] 1.4 `rollbackRegenerate` 使用 `resolveTargetIndex` + Immer draft 直接索引赋值替代 `[...arr]` 拷贝模式（content + reasoningContent）
- [x] 1.5 `updateHistoryContent` 使用 `resolveTargetIndex` + Immer draft 直接索引赋值替代 `[...arr]` 拷贝模式（content + reasoningContent）
- [x] 1.6 删除不再需要的 `pushContent` 函数
- [x] 1.7 验证 chatHistoryHelper 的单元测试全部通过

## 2. StreamingContent 渲染契约修复

- [x] 2.1 将冻结块计算逻辑移入 useMemo：通过 prevSplitPointRef 对比分割点，仅对新增部分调用 generateCleanHtml
- [x] 2.2 frozenBlocksRef 改为存储持久冻结块列表，渲染阶段追加 useMemo 返回的增量块（通过 `lastAppendedStartRef` 保证幂等性：仅在 activeStart 变化时追加）
- [x] 2.3 非流式路径保持 fullHtml useMemo 不变，流式结束或内容缩短时清空 frozenBlocksRef（检测 activeStart === 0 && frozenBlocksRef.length > 0，同步重置 lastAppendedStartRef）
- [x] 2.4 验证流式渲染正常工作（冻结块不闪烁、活跃块正确更新）

## 3. Detail 组件 memo 保护链路修复

- [x] 3.1 `messagePairs` useMemo 依赖从 `displayList` 改为 `historyList`
- [x] 3.2 `historyCallbacks` useMemo 依赖保持 `[messagePairs]`（因 3.1 已使 messagePairs 依赖 historyList，流式期间 messagePairs 稳定，无需额外 ref 间接层）
- [x] 3.3 验证 `historyCallbacks` 在流式期间引用稳定（messagePairs → historyCallbacks 传递链等价于 historyList → historyCallbacks）
- [x] 3.4 创建 `messageMap`（Map<string, StandardMessage>）useMemo 缓存（依赖 historyList）
- [x] 3.5 `handleCopy` 改用 `messageMap.get(messageId)` 查找，依赖改为 `[messageMap, t]`
- [x] 3.6 验证流式期间 ChatBubble 的 memo 保护生效（onHistoryIndexChange/onCopy 引用稳定）

## 4. ChatBubble 质量改进

- [x] 4.1 `currentContent` useMemo 改用 `getContentAtIndex(content, historyIndex)`
- [x] 4.2 `currentReasoning` useMemo 改用 `getContentAtIndex(reasoningContent, historyIndex)`（保留 undefined 短路）
- [x] 4.3 `isContentEqual` 改为全数组逐元素比较（`a.every((val, i) => val === b[i])`）
- [x] 4.4 导入 `getContentAtIndex`（已导入 `getCurrentContent`，同模块）

## 5. 低优先级清理

- [~] 5.1 删除 ChatBubble 中约 5 行自明注释（`// 用户对话气泡`、`// AI 助手对话气泡` 等）— 用户要求保留注释，跳过
- [~] 5.2 删除 Detail/index.tsx 中约 20 行自明注释（`// 历史消息列表`、`// 引用滚动容器` 等）— 用户要求保留注释，跳过
- [~] 5.3 删除 chatHistoryHelper.ts 中 2 行自明注释 — 用户要求保留注释，跳过
- [x] 5.4 ThinkingSection 的 `<Card className="mb-2 bg-transparent border-none shadow-none">` 替换为 `<div className="mb-2">`
- [x] 5.5 generateCleanHtml 添加空字符串短路：`if (!dirtyMarkdown) return ''`
- [x] 5.6 chatMiddleware.ts 中 `action.type === 'chatModel/sendMessage/fulfilled'` 改为导入 `sendMessage` 后使用 `sendMessage.fulfilled.match(action)`

## 6. 验证

- [x] 6.1 运行 `pnpm tsc` 确保无类型错误
- [x] 6.2 运行 `pnpm lint` 确保无 lint 错误
- [x] 6.3 运行 `pnpm test` 确保所有测试通过
- [x] 6.4 手动验证流式消息渲染、编辑、重新生成功能正常

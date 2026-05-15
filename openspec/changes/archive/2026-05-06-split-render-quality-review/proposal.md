## Why

feat/split-render 分支引入了流式增量渲染、消息操作（复制/编辑/重新生成）和编辑历史翻页等大量新功能，代码审查发现 12 个确定的质量问题：渲染阶段副作用违反 React 契约、chatHistoryHelper 中 8 处重复的数组操作模式、流式期间 memo 保护链路断裂导致全量重渲染、Immer draft 中不必要的数组拷贝等。这些问题影响代码可维护性和运行时性能，需在合并前修复。

## What Changes

- **StreamingContent 渲染阶段副作用重构**：将 refs 读写逻辑从渲染路径移入 `useMemo`，消除 React Strict Mode 下的重复执行风险
- **chatHistoryHelper 重复模式提取**：提取 `resolveTargetIndex` 辅助函数，消除 `commitRegenerate`/`rollbackRegenerate`/`updateHistoryContent` 中 8 处重复的"计算索引 + 替换数组元素"模式
- ~~**findMessageIndex 查找优化**~~：（已撤回）原方案假设所有模型共享消息 ID，实际每个模型的 chatHistoryList 使用独立 ID，"只查第一个模型"会导致非首选模型的重新生成功能失效
- **Detail 组件 memo 保护链路修复**：`messagePairs` 依赖从 `displayList` 改为 `historyList`，`historyCallbacks` 改用 ref 读取 messagePairs，避免流式期间级联重建破坏 ChatBubble 的 memo 保护
- **Immer draft 数组操作优化**：`pushContent` 和 8 处 `[...array]` 拷贝改为直接操作 Immer draft，消除不必要的数组拷贝
- **isContentEqual 比较修正**：从只比较数组末尾元素改为全数组逐元素比较，确保翻页场景下 UI 正确更新
- **handleCopy 依赖优化**：将 `historyList.find()` 改为 `Map` 查找，消除流式期间的回调重建
- **删除不必要的注释**：移除约 25 行解释代码行为（WHAT）的注释，仅保留解释非显而易见的 WHY 的注释
- **ThinkingSection DOM 简化**：去除所有视觉特征重置的 `<Card>` 包裹，替换为普通 `<div>`
- **middleware action type 安全**：字符串硬编码 `'chatModel/sendMessage/fulfilled'` 改用 `.match()` 类型安全匹配
- **generateCleanHtml 空字符串短路**：添加空输入快速返回
- **ChatBubble 内联逻辑复用**：`currentContent`/`currentReasoning` 的 useMemo 改用已有的 `getContentAtIndex`

## Capabilities

### New Capabilities

（无需新增 capability）

### Modified Capabilities

- `streaming-content-render`: 渲染阶段 refs 副作用重构为 useMemo
- `chat-history-helper`: 提取 resolveTargetIndex 辅助函数，Immer draft 直接操作优化
- `custom-chat-components`: 删除冗余注释，ThinkingSection Card→div，currentContent/currentReasoning 使用 getContentAtIndex，isContentEqual 全数组比较
- `virtual-scroll`: messagePairs 依赖修正为 historyList，historyCallbacks 稳定性优化，handleCopy Map 查找

## Impact

- **前端组件**：`StreamingContent.tsx`、`ChatBubble.tsx`、`ThinkingSection.tsx`、`Detail/index.tsx`
- **服务层**：`chatHistoryHelper.ts`
- **工具层**：`markdown.ts`
- **状态层**：`chatMiddleware.ts`
- **无 API 变更**、无 breaking change、无新增依赖

## Why

新建聊天时存在竞态条件：`createNewChat` 同步修改 `chatMetaList` 和 `selectedChatId` 后调用 `navigateToChat`。ChatPage useEffect 依赖 `chatMetaList`，当 React 未将 navigate 的 URL 更新与 Redux 状态更新批处理到同一渲染周期时，useEffect 会用旧的 `searchParams` 触发 `setSelectedChatIdWithPreload`，其 fulfilled handler 将 `selectedChatId` 覆盖回旧值并删除新聊天的 `activeChatData`。Content 组件显示 Placeholder 而非 ModelSelect 页面。由于 React 18 与 React Router 的批处理时序不确定性，此问题非 100% 复现，属于典型的 Heisenbug。

## What Changes

- 从 ChatPage useEffect 的依赖数组中移除 `chatMetaList`，使 useEffect 仅在 URL 变化时触发，从源头阻止 stale thunk 被 dispatch
- 在 `chatMiddleware` 中补充对 `deleteChat` 的 URL 清理处理：当删除的聊天是当前 URL 中 `chatId` 指向的聊天时，清除 URL 参数

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `chat-selection-sync`: useEffect 触发条件从"URL 或聊天列表变化"改为"仅 URL 变化"，消除竞态路径；删除聊天时 URL 参数清理改由中间件处理

## Impact

- `src/pages/Chat/index.tsx`：useEffect 依赖数组移除 `chatMetaList`
- `src/store/middleware/chatMiddleware.ts`：`deleteChat` effect 中补充 URL 参数清理逻辑

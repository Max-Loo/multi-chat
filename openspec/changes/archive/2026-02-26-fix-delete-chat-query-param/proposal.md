## Why

删除聊天时，Redux state 中的 `selectedChatId` 被清除了，但 URL 查询参数中的 `chatId` 仍然保留。这会导致用户刷新页面后，应用尝试加载已删除的聊天，影响用户体验。

## What Changes

- **删除聊天时同步清除 URL 查询参数**：当用户删除当前选中的聊天时，除了清除 Redux state 中的 `selectedChatId`，还需要同时清除 URL 中的 `chatId` 查询参数
- **新增导航辅助函数**：提供 `navigateToChatWithoutParams()` 函数用于清除聊天相关的查询参数
- **修改删除聊天逻辑**：在 `ChatButton.tsx` 的 `handleDelete` 函数中，删除成功后调用导航函数清除 URL 参数

## Capabilities

### New Capabilities
- `chat-deletion-url-sync`: 聊天删除时的 URL 同步清除能力，确保删除操作同时更新 Redux state 和 URL 查询参数

### Modified Capabilities
无。这是一个 bug 修复，不涉及现有 spec 的需求变更。

## Impact

**影响的代码模块**：
- `src/hooks/useNavigateToPage.ts`：新增 `navigateToChatWithoutParams()` 函数用于清除查询参数
- `src/pages/Chat/components/ChatSidebar/components/ChatButton.tsx`：修改 `handleDelete` 函数，在删除成功后调用导航函数

**影响的用户流程**：
- 用户删除当前选中的聊天后，URL 会从 `/chat?chatId=xxx` 变为 `/chat`
- 用户刷新页面后，不会尝试加载已删除的聊天

**不影响的模块**：
- Redux state 管理（`chatSlices.ts`）
- 路由配置（`router/index.tsx`）
- ChatPage 组件（`pages/Chat/index.tsx`）

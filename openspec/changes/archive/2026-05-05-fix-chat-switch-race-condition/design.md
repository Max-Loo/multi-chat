## Context

`createNewChat` 在同一个 click handler 中同步执行三步操作：`dispatch(createChat)`、`dispatch(setSelectedChatId)`、`navigateToChat()`。ChatPage useEffect 的依赖数组包含 `chatMetaList` 和 `searchParams`。当 React 未将 navigate 的 URL 更新与 Redux 状态更新批处理到同一渲染周期时（慢路径），useEffect 因 `chatMetaList` 变化而提前触发，此时 `searchParams` 仍为旧值，dispatch 了指向旧聊天 ID 的 thunk。

审查中排除了快照一致性检查方案（原方案 4）：由于 `setSelectedChatId` 在 thunk 被 dispatch 之前已同步修改 `selectedChatId`，thunk 捕获的快照不是"原始值"而是"已被修改后的值"，一致性检查在竞态路径下必然通过（`'new' === 'new'`），无法起到保护作用。

## Goals / Non-Goals

**Goals:**
- 从源头阻止 stale thunk 被 dispatch，消除竞态条件
- 保持删除聊天时 URL 参数能被正确清理

**Non-Goals:**
- 不修改 `setSelectedChatIdWithPreload` thunk 或其 fulfilled handler
- 不修改 `useCreateChat` hook 或 `setSelectedChatId` 同步 action
- 不引入新的状态管理机制（如版本号、乐观锁）

## Decisions

### Decision 1: 从 useEffect 依赖数组移除 `chatMetaList`，保留函数体中的存在性检查

useEffect 不再因 `chatMetaList` 变化而触发，仅因 `searchParams`、`loading`、`initializationError` 变化而触发。这直接消除了竞态路径——即使 `createChat` 修改了 `chatMetaList`，只要 URL 没变，useEffect 不会 dispatch 任何 thunk。当 `navigateToChat` 更新 URL 后，useEffect 才触发，此时读到的 `chatId` 是正确的新值。

函数体中保留 `chatMetaList.find()` 存在性检查。`loading` 仍在依赖数组中，当 loading 变为 false 时 useEffect 触发，此时 chatMetaList 已是加载后的最新值，find 检查可正确判断聊天是否存在。不存在的聊天调用 `clearChatIdParam()` 清除 URL，防止 `loadChatById` 加载已软删除的聊天数据（存储层为软删除，`loadChatById` 不过滤 `isDeleted`，会返回已删除聊天的完整数据）。

**理由**: 竞态的根因是 useEffect 因 `chatMetaList` 变化而提前触发，携带了旧的 `searchParams`。移除这个依赖直接切断竞态路径。保留存在性检查则维持了对"深链/书签访问已删除聊天"场景的保护。

**备选方案**:
- 快照一致性检查（原方案 4）: 无效——快照在同步 action 之后捕获，起不到保护作用
- 移除 `setSelectedChatId` 同步 dispatch: 会导致新建聊天时短暂闪屏
- 乐观锁/版本号: 过度设计
- 移除函数体中的存在性检查: 不可行——`loadChatById` 不过滤已删除聊天，会导致已删除聊天被加载展示

### Decision 2: 删除聊天的 URL 清理由中间件防御性兜底

移除 `chatMetaList` 依赖后，删除当前聊天时 useEffect 不再因 chatMetaList 变化而触发，无法通过该路径清除 URL 中的无效 `chatId` 参数。在 `chatMiddleware` 的 `deleteChat` effect 中补充 URL 清理逻辑作为防御性兜底。

**注意**: `ChatButton` 组件已在 `deleteChat` dispatch 后调用 `clearChatIdParam()` 处理正常删除路径。中间件覆盖其他可能的 `deleteChat` 调用入口。

**实现方式**: 中间件通过 `listenerApi.getState()` 检查 `state.chat.selectedChatId` 是否与被删除聊天 ID 匹配，匹配时通过 `window.history.replaceState` 清除 URL 中的 `chatId` 参数。

**理由**: URL 清理是删除操作的副作用，放在中间件中语义更清晰且覆盖面更广。`deleteChat` reducer 已经处理了 `selectedChatId = null`，中间件只需额外清除 URL 参数。

## Risks / Trade-offs

- **[useEffect 不再响应 chatMetaList 变化]** → 仅影响"删除当前聊天时 URL 清理"这一个场景，已通过中间件兜底。其他 chatMetaList 变更（重命名、AI 自动命名）不需要触发 useEffect
- **[chatMetaList 存在性检查使用闭包捕获值]** → `chatMetaList` 不在依赖数组中，ESLint exhaustive-deps 规则会报警，需添加抑制注释。实际安全：`loading` 仍在依赖数组中，loading 变化时 useEffect 触发，此时 chatMetaList 是当前渲染的最新值
- **[中间件通过 window.history.replaceState 清理 URL]** → 不依赖 React Router 的 `setSearchParams`，避免在中间件中引入 React hook 依赖。副作用是绕过了 React Router 的 URL 状态管理，但此场景仅清除参数、不需要路由感知

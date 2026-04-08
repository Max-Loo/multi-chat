## Why

`useCurrentSelectedChat` hook 内部用两个 `useAppSelector` 分别取 `selectedChatId` 和 `chatList`，再用 `useMemo` + `find` 查找选中的 chat。任何导致 `chatList` 引用变化的 state 更新（如 runningChat 推送消息）都会使 `useMemo` 重新执行，即使选中的 chat 对象没变也会返回新引用，触发消费组件不必要的重渲染。

## What Changes

- 创建 `src/store/selectors/chatSelectors.ts`，用 `createSelector` 实现 `selectSelectedChat`，精确缓存 find 结果
- 创建 `src/store/selectors/index.ts` 统一导出
- 简化 `src/hooks/useCurrentSelectedChat.ts`，改用 `selectSelectedChat`

## Capabilities

### New Capabilities
- `selected-chat-selector`: 使用 `createSelector` 的 memoized selector，只在 find 结果引用真正变化时才返回新值

## Impact

- **涉及文件**：3 个（新增 2 个 selector 文件，修改 1 个 hook）
- **新增文件**：`src/store/selectors/chatSelectors.ts`、`src/store/selectors/index.ts`
- **依赖**：无新依赖，`createSelector` 内置在 `@reduxjs/toolkit`
- **风险**：纯重构，不改变业务逻辑

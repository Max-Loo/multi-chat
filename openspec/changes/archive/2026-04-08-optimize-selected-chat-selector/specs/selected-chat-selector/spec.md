## ADDED Requirements

### Requirement: selectSelectedChat 使用 createSelector 实现 memoization

系统 SHALL 使用 `@reduxjs/toolkit` 的 `createSelector` 创建 `selectSelectedChat` selector，组合 `selectSelectedChatId` 和 `selectChatList` 两个 input selector。`selectSelectedChat` 只在 `find` 结果的引用真正发生变化时返回新值，避免因 `chatList` 引用变化但选中 chat 未变时触发消费组件重渲染。

#### Scenario: chatList 引用变化但选中 chat 未变
- **WHEN** `chatList` 因其他 chat 更新（如 runningChat 推送消息）产生新引用，但选中的 chat 对象本身未变
- **THEN** `selectSelectedChat` 返回上一次缓存的 chat 引用，`useAppSelector` 的 `===` 比较跳过重渲染

#### Scenario: 选中的 chat 发生变化
- **WHEN** 用户切换选中的 chat，`selectedChatId` 变化
- **THEN** `selectSelectedChat` 重新执行 `find`，返回新 chat 引用，消费组件重渲染

#### Scenario: selectedChatId 为空
- **WHEN** `selectedChatId` 为 `undefined` 或 `null`
- **THEN** `selectSelectedChat` 返回 `undefined`

### Requirement: useCurrentSelectedChat hook 使用 selectSelectedChat

`useCurrentSelectedChat` hook SHALL 使用 `selectSelectedChat` 替代内部的 `useMemo` + `find` 逻辑，返回 `selectedChat ?? null`。

#### Scenario: hook 正常工作
- **WHEN** store 中存在选中的 chat
- **THEN** hook 返回该 chat 对象

#### Scenario: 无选中 chat
- **WHEN** store 中 `selectedChatId` 为空
- **THEN** hook 返回 `null`

### Requirement: input selectors 不单独导出

`selectSelectedChatId` 和 `selectChatList` SHALL 作为 `createSelector` 的内部 input selectors，不从 `index.ts` 导出。外部消费方只需使用 `selectSelectedChat`。

#### Scenario: 外部消费方使用
- **WHEN** 组件或 hook 需要获取选中的 chat
- **THEN** 通过 `import { selectSelectedChat } from '@/store/selectors'` 获取

## MODIFIED Requirements

### Requirement: useCreateChat 创建聊天

useCreateChat 的 `createNewChat` 方法 SHALL 创建新聊天并导航到聊天页面。

#### Scenario: createNewChat 通过真实 store dispatch action

- **WHEN** 使用 `renderHookWithProviders` 渲染 hook 并调用 `createNewChat()`
- **THEN** store 中 `chat.chatList` SHALL 包含新创建的聊天对象
- **AND** 新聊天对象 SHALL 包含 `id` 字段（非空字符串）
- **AND** 新聊天对象 SHALL 包含 `name` 字段（空字符串）

#### Scenario: createNewChat 调用导航

- **WHEN** 调用 `createNewChat()`
- **THEN** `navigateToChat` 方法 SHALL 被调用
- **AND** 传入参数 SHALL 包含生成的 chat.id

#### Scenario: createNewChat 不使用 mock dispatch

- **WHEN** 检查 `src/__test__/hooks/useCreateChat.test.ts`
- **THEN** 文件 SHALL NOT 包含 `vi.mock('@/hooks/redux')`
- **AND** 文件 SHALL 从 `@/__test__/helpers/render/redux` 导入 `renderHookWithProviders`

### Requirement: useCreateChat Hook 返回值

useCreateChat Hook SHALL 返回包含 `createNewChat` 方法的对象。

#### Scenario: Hook 返回 createNewChat 方法

- **WHEN** 使用 `renderHookWithProviders` 调用 `useCreateChat()`
- **THEN** 返回对象包含 `createNewChat` 方法

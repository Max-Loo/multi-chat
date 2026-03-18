# Spec: useCreateChat Hook 单元测试

## Purpose

验证 useCreateChat Hook 的返回值、创建聊天功能以及依赖稳定性。

## Requirements

### Requirement: useCreateChat Hook 返回值

useCreateChat Hook SHALL 返回包含 `createNewChat` 方法的对象。

#### Scenario: Hook 返回 createNewChat 方法
- **WHEN** 调用 `useCreateChat()`
- **THEN** 返回对象包含 `createNewChat` 方法

---

### Requirement: useCreateChat 创建聊天

useCreateChat 的 `createNewChat` 方法 SHALL 创建新聊天并导航到聊天页面。

#### Scenario: createNewChat 调用 dispatch
- **WHEN** 调用 `createNewChat()`
- **THEN** dispatch `createChat` action
- **AND** action payload 包含生成的 chat 对象

#### Scenario: createNewChat 生成正确的 chat 对象
- **WHEN** 调用 `createNewChat()`
- **THEN** 生成的 chat 对象包含 `id` 字段（非空字符串）
- **AND** 生成的 chat 对象包含 `name` 字段（空字符串）

#### Scenario: createNewChat 调用导航
- **WHEN** 调用 `createNewChat()`
- **THEN** 调用 `navigateToChat` 方法
- **AND** 传入参数包含生成的 chat.id

---

### Requirement: useCreateChat Hook 依赖稳定

useCreateChat Hook SHALL 使用 `useCallback` 保持 `createNewChat` 方法的引用稳定。

#### Scenario: createNewChat 引用稳定
- **WHEN** 在相同依赖下多次渲染组件
- **THEN** `createNewChat` 方法引用保持不变

#### Scenario: createNewChat 依赖正确
- **WHEN** dispatch 或 navigateToChat 改变时
- **THEN** `createNewChat` 方法使用新的依赖值

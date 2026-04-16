# Spec: memoized selector 单元测试

## Purpose

确保 `src/store/selectors/chatSelectors.ts` 中的导出 selector 经过单元测试验证，包括返回值正确性和 memoization 引用稳定性。

## Requirements

### Requirement: memoized selector 单元测试

系统 SHALL 为 `src/store/selectors/chatSelectors.ts` 中的每个导出 selector 添加单元测试文件 `src/__test__/store/selectors/chatSelectors.test.ts`。

#### Scenario: selectSelectedChat 返回匹配的聊天对象

- **WHEN** state 中 `selectedChatId` 为 `'chat-1'`，`chatList` 包含 id 为 `'chat-1'` 的聊天
- **THEN** `selectSelectedChat(state)` SHALL 返回该聊天对象

#### Scenario: selectSelectedChat 未选中时返回 undefined

- **WHEN** state 中 `selectedChatId` 为 `null`
- **THEN** `selectSelectedChat(state)` SHALL 返回 `undefined`

#### Scenario: selectSelectedChat 列表中无匹配时返回 undefined

- **WHEN** state 中 `selectedChatId` 为 `'chat-99'`，`chatList` 不包含该 id
- **THEN** `selectSelectedChat(state)` SHALL 返回 `undefined`

#### Scenario: selectSelectedChat memoization 引用稳定

- **WHEN** 连续两次使用相同的 state 对象调用 `selectSelectedChat`
- **THEN** 两次返回值 SHALL 是相同的引用（`===`）

#### Scenario: selectSelectedChat 输入变化时重新计算

- **WHEN** `selectedChatId` 从 `'chat-1'` 变为 `'chat-2'`
- **THEN** `selectSelectedChat` SHALL 返回新的聊天对象（非缓存值）

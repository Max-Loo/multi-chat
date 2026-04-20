## MODIFIED Requirements

### Requirement: 测试统一使用全局工厂函数

测试文件 MUST NOT 定义本地工厂函数（如 `createMockChat`、`createMockMessage`），SHALL 从全局 fixtures 模块导入。

#### Scenario: chatSlices.test.ts 使用全局 fixtures

- **WHEN** `store/slices/chatSlices.test.ts` 定义了本地 `createMockChat` 和 `createMockMessage`
- **THEN** 这些本地定义 SHALL 被删除，替换为从全局 fixtures 模块导入

#### Scenario: useCurrentSelectedChat 使用全局 fixtures

- **WHEN** `hooks/useCurrentSelectedChat.test.tsx` 定义了本地 `createMockChat`
- **THEN** 该本地定义 SHALL 被删除，替换为从全局 fixtures 模块导入

#### Scenario: useExistingChatList 使用全局 fixtures

- **WHEN** `hooks/useExistingChatList.test.tsx` 定义了本地 `createMockChat`
- **THEN** 该本地定义 SHALL 被删除，替换为从全局 fixtures 模块导入

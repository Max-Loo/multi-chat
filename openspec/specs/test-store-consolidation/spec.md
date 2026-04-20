## ADDED Requirements

### Requirement: createRunningChatEntry 辅助函数

系统 SHALL 在 `src/__test__/helpers/mocks/testState.ts` 中导出 `createRunningChatEntry(chatId, modelId, overrides)` 函数，用于创建 `runningChat` 的嵌套状态结构。

#### Scenario: 创建默认 runningChat entry

- **WHEN** 调用 `createRunningChatEntry('chat-1', 'model-1')` 不传入 overrides
- **THEN** SHALL 返回 `{ 'chat-1': { 'model-1': { isSending: false, history: null } } }`

#### Scenario: 创建带覆盖的 runningChat entry

- **WHEN** 调用 `createRunningChatEntry('chat-1', 'model-1', { isSending: true, history: mockStandardMessage })` 传入覆盖参数
- **THEN** SHALL 返回 `{ 'chat-1': { 'model-1': { isSending: true, history: mockStandardMessage } } }`，其中 `history` 类型为 `StandardMessage | null`，可选字段 `errorMessage` 可通过 overrides 覆盖

#### Scenario: 与 createChatSliceState 组合使用

- **WHEN** 将 `createRunningChatEntry` 的结果作为 `createChatSliceState` 的 `runningChat` 参数
- **THEN** 生成的 `ChatSliceState` SHALL 包含正确的嵌套 runningChat 结构

### Requirement: RunningChatBubble 使用已有状态工厂

RunningChatBubble.test.tsx SHALL 不再直接调用 `configureStore`，改用 `createTypeSafeTestStore` + `createChatSliceState` + `createRunningChatEntry`。

#### Scenario: 不再包含 configureStore 直接调用

- **WHEN** 检查 `src/__test__/components/RunningChatBubble.test.tsx`
- **THEN** 文件 SHALL 不包含从 `@reduxjs/toolkit` 导入 `configureStore`，也不 SHALL 包含直接的 `configureStore(` 调用

#### Scenario: 使用 createTypeSafeTestStore 创建 store

- **WHEN** 检查 RunningChatBubble.test.tsx 中的 store 创建代码
- **THEN** 所有 store 实例 SHALL 通过 `createTypeSafeTestStore` 创建

### Requirement: panelLayout 使用 testState 工厂函数

`createPanelLayoutStore` SHALL 使用 `createChatSliceState` 和 `createModelSliceState` 生成默认值，不 SHALL 内联定义 slice 默认状态。

#### Scenario: 不包含内联默认状态定义

- **WHEN** 检查 `src/__test__/helpers/mocks/panelLayout.tsx`
- **THEN** 文件 SHALL 不包含 `defaultChatState` 或 `defaultModelsState` 的内联对象定义

#### Scenario: 使用 createChatSliceState 生成默认值

- **WHEN** 检查 `createPanelLayoutStore` 的实现
- **THEN** chat 的默认值 SHALL 通过调用 `createChatSliceState(overrides?.chatState)` 生成

#### Scenario: 使用 createModelSliceState 生成默认值

- **WHEN** 检查 `createPanelLayoutStore` 的实现
- **THEN** models 的默认值 SHALL 通过调用 `createModelSliceState(overrides?.modelsState)` 生成

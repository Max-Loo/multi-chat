# test-store-consolidation Spec

## Purpose

规范测试 store 构造的收敛：测试文件 SHALL 复用共享状态工厂（`createTypeSafeTestStore` + slice state 工厂组合），消除内联 `configureStore` 与逐字重复的默认状态定义，保证 store 构造的一致性与类型安全。

## Requirements

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

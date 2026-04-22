## ADDED Requirements

### Requirement: getBy 系列查询后不得跟随冗余的 toBeInTheDocument 断言

测试中使用 `getByTestId`、`getByRole`、`getByText` 等 `getBy*` 系列方法获取元素后，MUST NOT 紧跟 `toBeInTheDocument()` 断言，因为这些方法在元素不存在时已经抛出异常。

#### Scenario: Layout 测试移除冗余存在性断言

- **WHEN** `Layout.test.tsx` 使用 `screen.getByTestId` 或 `screen.getByRole` 获取元素
- **THEN** MUST NOT 紧跟 `expect(...).toBeInTheDocument()` 断言，应直接使用获取到的元素进行后续断言（如 `toHaveClass`、`toHaveAttribute`）

### Requirement: 不依赖 Redux 状态的测试必须共享 store 实例

当 `describe` 块内所有测试均不依赖特定 Redux 状态时，store MUST 在 `beforeEach` 或 `describe` 级别创建一次并共享，MUST NOT 在每个测试中独立创建。

#### Scenario: Layout 测试共享 store

- **WHEN** `Layout.test.tsx` 的测试用例只验证 DOM 结构和 CSS class，不依赖特定 Redux 状态
- **THEN** MUST 在 `describe` 块级别创建一个共享的 `createTypeSafeTestStore()` 实例，MUST NOT 每个测试都调用 `createTypeSafeTestStore()`

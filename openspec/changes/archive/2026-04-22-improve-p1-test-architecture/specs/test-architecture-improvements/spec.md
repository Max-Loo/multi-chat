## ADDED Requirements

### Requirement: resetStore 不能执行无效的 Redux dispatch
`resetStore` 函数 MUST NOT dispatch 无任何 reducer 处理的 action。

#### Scenario: resetStore 仅置空 store 引用
- **WHEN** `resetStore()` 被调用
- **THEN** 函数 MUST 仅将 store 引用设为 null，MUST NOT dispatch 任何 action

### Requirement: Redux reducer 测试必须在单元测试文件中
仅测试 Redux reducer 逻辑（dispatch action → 验证 state）的测试 MUST 放在对应的 slice 单元测试文件中，MUST NOT 放在集成测试文件中。

#### Scenario: 纯 state 测试不渲染组件
- **WHEN** 一个测试只包含 `store.dispatch(action)` 和 `expect(store.getState())` 断言
- **THEN** 该测试 MUST NOT 渲染任何 React 组件

#### Scenario: 集成测试中的 TODO 迁移注释不遗留
- **WHEN** `TODO(单元测试迁移)` 标记的测试已被迁移
- **THEN** 原文件中的该测试和 TODO 注释 MUST 被删除

### Requirement: 单元测试应利用多核并行执行
单元测试配置 SHOULD 允许并行执行以利用多核性能，而非强制单线程。

#### Scenario: maxThreads 大于 1
- **WHEN** 检查 `vite.config.ts` 中的 Vitest pool 配置
- **THEN** `maxThreads` MUST 大于 1

#### Scenario: 多线程测试稳定性
- **WHEN** 使用 `maxThreads: 2` 运行完整测试套件
- **THEN** 所有测试 MUST 通过，无并发相关的失败

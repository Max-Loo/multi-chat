# Spec Delta

## ADDED Requirements

### Requirement: 支持 Vue 组件测试

系统 SHALL 集成 @vue/test-utils 与 @testing-library/vue，支持 Vue 单文件组件的挂载和交互测试。

#### Scenario: 挂载 Vue 组件

- **WHEN** 测试代码使用 `mount()`（@vue/test-utils）或 `render()`（@testing-library/vue）挂载单文件组件
- **THEN** 系统在 happy-dom 环境中正确渲染组件并返回查询对象
- **AND** 支持挂载 Pinia、vue-router、i18n 等插件上下文的组件

#### Scenario: 模拟用户交互

- **WHEN** 测试代码使用 `trigger()`、`setValue()` 或 @testing-library/user-event 模拟用户点击与输入
- **THEN** 系统触发组件的事件处理器并验证状态与 DOM 变化
- **AND** 异步更新（如 nextTick 后的 DOM 变化）可被正确断言

## REMOVED Requirements

### Requirement: 支持 React 组件测试

**Reason**: 前端框架从 React 迁移至 Vue 3，@testing-library/react 及其 React 组件渲染/交互范式不再适用。
**Migration**: 由新需求"支持 Vue 组件测试"承接——组件测试改用 @vue/test-utils（mount/trigger/setValue）与 @testing-library/vue 实现，测试意图与断言策略保持等价迁移。

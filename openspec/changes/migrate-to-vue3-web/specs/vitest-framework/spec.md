# Spec Delta

## ADDED Requirements

### Requirement: 支持 Vue 组件测试
系统 SHALL 集成 Vue Testing Library，支持 Vue3 单文件组件的挂载和交互测试。

#### Scenario: 挂载 Vue 组件
- **WHEN** 测试代码使用 `render()` 函数挂载组件
- **THEN** 系统在 happy-dom 环境中正确渲染组件并返回查询对象

#### Scenario: 模拟用户交互
- **WHEN** 测试代码使用 `userEvent.click()` 模拟用户点击
- **THEN** 系统触发组件的事件处理器并验证状态变化

#### Scenario: 测试组合式 API 逻辑
- **WHEN** 测试代码挂载使用组合式 API 的组件
- **THEN** 响应式状态变更正确反映到渲染输出

## REMOVED Requirements

### Requirement: 支持 React 组件测试
**Reason**: 前端框架已从 React 迁移至 Vue3，@testing-library/react 及 React 组件渲染测试不再适用。
**Migration**: 组件测试改用 Vue Testing Library（`render` 挂载 `.vue` 组件），交互断言模式保持 Testing Library 的用户行为驱动风格不变。

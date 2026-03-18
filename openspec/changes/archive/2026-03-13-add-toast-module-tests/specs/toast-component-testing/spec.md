# Toast 组件测试规范

## ADDED Requirements

### Requirement: ToasterWrapper 组件响应式状态同步
ToasterWrapper 组件必须在渲染时同步响应式状态到 toastQueue 单例。

#### Scenario: 移动端状态同步
- **WHEN** 组件首次渲染且 `isMobile` 为 `true`
- **THEN** 组件 SHALL 调用 `toastQueue.setIsMobile(true)`

#### Scenario: 桌面端状态同步
- **WHEN** 组件首次渲染且 `isMobile` 为 `false`
- **THEN** 组件 SHALL 调用 `toastQueue.setIsMobile(false)`

#### Scenario: 响应式状态变化
- **WHEN** `isMobile` 状态在组件生命周期内发生变化
- **THEN** 组件 SHALL 重新调用 `toastQueue.setIsMobile()` 以更新状态

### Requirement: ToasterWrapper 竞态条件防护
ToasterWrapper 组件必须在 `isMobile` 状态确定后才标记 Toast 系统就绪，防止竞态条件。

#### Scenario: isMobile 未确定时不标记就绪
- **WHEN** `isMobile` 为 `undefined`
- **THEN** 组件 SHALL 不调用 `toastQueue.markReady()`

#### Scenario: isMobile 确定后标记就绪
- **WHEN** `isMobile` 从 `undefined` 变为确定值（`true` 或 `false`）
- **THEN** 组件 SHALL 调用 `toastQueue.markReady()`

#### Scenario: 防止重复标记就绪
- **WHEN** 组件多次重新渲染且 `isMobile` 已确定
- **THEN** 组件 SHALL 只调用一次 `toastQueue.markReady()`

### Requirement: ToasterWrapper UI 渲染
ToasterWrapper 组件必须正确渲染 Toaster UI 组件。

#### Scenario: 渲染 Toaster 组件
- **WHEN** 组件渲染
- **THEN** 系统 SHALL 渲染 sonner Toaster 组件

#### Scenario: 组件卸载
- **WHEN** 组件卸载
- **THEN** 系统 SHALL 清理所有副作用和监听器
- **AND** 不抛出任何错误

### Requirement: ToasterWrapper 组件生命周期
ToasterWrapper 组件必须正确管理组件生命周期和副作用。

#### Scenario: useEffect 依赖清理
- **WHEN** 组件卸载
- **THEN** 系统 SHALL 清理所有事件监听器和定时器

#### Scenario: 组件重新渲染稳定性
- **WHEN** 组件因 prop 变化而重新渲染
- **THEN** 系统 SHALL 保持内部状态一致性
- **AND** 不触发不必要的副作用

### Requirement: Mock 隔离
测试必须使用 Mock 隔离外部依赖，确保测试单元独立性。

#### Scenario: Mock useResponsive Hook
- **WHEN** 测试 ToasterWrapper 组件
- **THEN** 测试 SHALL Mock `useResponsive` Hook
- **AND** 返回可控的响应式状态对象

#### Scenario: Mock toastQueue 单例
- **WHEN** 测试 ToasterWrapper 组件
- **THEN** 测试 SHALL Mock `toastQueue` 单例
- **AND** 验证交互但不测试内部实现

#### Scenario: Mock sonner 库
- **WHEN** 测试 ToasterWrapper 组件
- **THEN** 测试 SHALL Mock sonner 库（系统边界）
- **AND** 返回简化的 Toaster 组件

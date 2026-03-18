# Toast 系统集成测试规范

## Purpose

定义 Toast 系统集成测试规范，确保 Toast 系统与应用其他模块（Redux、Router、异步操作等）的正确集成。

## Requirements

### Requirement: Toast 系统应用启动初始化
Toast 系统必须在应用启动时正确初始化，并与应用生命周期集成。

#### Scenario: Toast 系统初始化完成
- **WHEN** 应用启动并渲染 ToasterWrapper 组件
- **THEN** Toast 系统 SHALL 完成初始化
- **AND** `toastQueue.markReady()` 被调用

#### Scenario: 初始化前队列缓存
- **WHEN** Toast 方法在 `markReady()` 之前被调用
- **THEN** Toast 请求 SHALL 被加入队列
- **AND** 不立即显示给用户

#### Scenario: 队列刷新机制
- **WHEN** `toastQueue.markReady()` 被调用
- **THEN** 系统 SHALL 按顺序刷新队列中的 Toast
- **AND** 每个 Toast 间隔 500ms 显示

### Requirement: Redux middleware 与 Toast 集成
Toast 系统必须与 Redux middleware 集成，在特定 action 后显示 Toast 反馈。

#### Scenario: 语言切换成功显示 Toast
- **WHEN** 用户触发语言切换 action（`changeAppLanguage`）
- **AND** 语言切换成功
- **THEN** 系统 SHALL 显示成功 Toast
- **AND** Toast 包含成功消息

#### Scenario: 语言切换失败显示错误 Toast
- **WHEN** 用户触发语言切换 action
- **AND** 语言切换失败（如 localStorage 错误）
- **THEN** 系统 SHALL 显示错误 Toast
- **AND** Toast 包含错误信息

#### Scenario: 模型配置更新显示 Toast
- **WHEN** 用户更新模型配置
- **THEN** 系统 MAY 显示 Toast 反馈（取决于业务逻辑）

### Requirement: Toast 响应式位置集成
Toast 系统必须根据设备类型自动调整 Toast 位置，提供最佳用户体验。

#### Scenario: 移动端 Toast 位置
- **WHEN** 设备为移动端（`isMobile: true`）
- **THEN** 所有 Toast SHALL 显示在 `top-center` 位置
- **AND** 忽略用户传入的 position 参数

#### Scenario: 桌面端 Toast 位置
- **WHEN** 设备为桌面端（`isMobile: false`）
- **THEN** Toast SHALL 默认显示在 `bottom-right` 位置
- **AND** 用户可以自定义 position 参数

#### Scenario: 响应式位置动态切换
- **WHEN** 设备类型在应用使用过程中发生变化
- **THEN** 系统 SHALL 动态调整后续 Toast 的位置

### Requirement: Toast 队列与 Redux Store 集成
Toast 队列必须与 Redux store 状态保持同步，确保状态一致性。

#### Scenario: Redux store 状态访问
- **WHEN** Toast 系统初始化
- **THEN** 系统 SHALL 能够访问 Redux store 状态
- **AND** 根据 store 状态调整 Toast 行为

#### Scenario: Toast 不影响 Redux state
- **WHEN** Toast 显示或消失
- **THEN** Redux store 状态 SHALL 不受影响
- **AND** Toast 系统保持独立性

### Requirement: 集成测试模块隔离
集成测试必须使用独立的 Redux store 和环境隔离，确保测试独立性。

#### Scenario: 独立 Redux store
- **WHEN** 运行集成测试
- **THEN** 每个测试 SHALL 使用独立的 Redux store 实例
- **AND** 测试间不共享状态

#### Scenario: 模块缓存重置
- **WHEN** 集成测试开始
- **THEN** 系统 SHALL 使用 `vi.resetModules()` 重置模块缓存
- **AND** 获得新的 `toastQueue` 单例实例

#### Scenario: 测试清理
- **WHEN** 集成测试完成
- **THEN** 系统 SHALL 清理所有 Mock 和副作用
- **AND** 恢复测试环境到初始状态

### Requirement: Toast 与 Router 集成
Toast 系统必须与 React Router 集成，在路由变化时保持稳定。

#### Scenario: 路由变化时 Toast 稳定性
- **WHEN** 用户导航到不同页面
- **THEN** 已显示的 Toast SHALL 继续显示
- **AND** 不应因路由变化而中断或报错

#### Scenario: 快速导航场景
- **WHEN** 用户快速连续导航
- **THEN** Toast 系统 SHALL 不抛出错误
- **AND** 保持队列机制正常工作

### Requirement: 异步操作集成
Toast 系统必须正确处理应用中的异步操作和延迟加载场景。

#### Scenario: 异步操作期间的 Toast
- **WHEN** 应用执行异步操作（如 API 请求）
- **THEN** 系统 SHALL 支持 loading Toast
- **AND** 在操作完成后更新为成功/失败 Toast

#### Scenario: 延迟加载模块与 Toast
- **WHEN** Toast 相关模块延迟加载
- **THEN** 队列机制 SHALL 继续正常工作
- **AND** 不因延迟加载而丢失 Toast 请求

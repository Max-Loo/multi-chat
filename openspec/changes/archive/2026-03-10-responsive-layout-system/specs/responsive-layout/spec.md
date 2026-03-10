# 响应式布局能力规范

## ADDED Requirements

### Requirement: 响应式状态管理

系统必须提供响应式状态管理能力，使组件能够根据窗口宽度动态调整布局。

**实现方式**：使用 `useResponsive()` Hook 直接获取响应式状态，不使用 Context Provider。

#### Scenario: 获取当前布局模式
- **WHEN** 组件调用 `useResponsive()` Hook
- **THEN** 系统返回当前窗口宽度对应的布局模式（'mobile' | 'compact' | 'compressed' | 'desktop'）
- **AND** 返回窗口宽度和高度
- **AND** 返回布尔值：`isMobile`, `isCompact`, `isCompressed`, `isDesktop`
- **AND** Hook 内部使用 `useMediaQuery` 实现媒体查询

#### Scenario: 窗口宽度小于 768px 时为 Mobile 模式
- **WHEN** 窗口宽度 < 768px
- **THEN** `layoutMode` 必须为 'mobile'
- **AND** `isMobile` 必须为 true
- **AND** `isCompact` 必须为 false
- **AND** `isCompressed` 必须为 false
- **AND** `isDesktop` 必须为 false

### Requirement: 窗口尺寸监听

系统必须监听窗口尺寸变化，并在窗口 resize 时更新响应式状态。

**实现方式**：每个 `useMediaQuery` Hook 内部使用 150ms 节流优化（使用 es-toolkit 的 `throttle` 函数）。

#### Scenario: 窗口 resize 时状态更新
- **WHEN** 用户调整窗口大小
- **THEN** 系统立即响应第一次变化
- **AND** 在连续 resize 过程中，每 150ms 更新一次状态
- **AND** 所有使用 `useResponsive()` 的组件重新渲染
- **AND** 节流在 `useMediaQuery` Hook 内部实现，使用 es-toolkit

#### Scenario: 窗口 resize 跨越断点时触发布局切换
- **WHEN** 窗口宽度从 700px 增加到 800px（跨越 768px 断点）
- **THEN** `layoutMode` 从 'mobile' 切换到 'compact'
- **AND** 触发相应的布局组件更新

- **WHEN** 窗口宽度从 1000px 增加到 1100px（跨越 1024px 断点）
- **THEN** `layoutMode` 从 'compact' 切换到 'compressed'
- **AND** 触发相应的布局组件更新

- **WHEN** 窗口宽度从 1200px 增加到 1300px（跨越 1280px 断点）
- **THEN** `layoutMode` 从 'compressed' 切换到 'desktop'
- **AND** 触发相应的布局组件更新

#### Scenario: 快速连续 resize 时只更新一次
- **WHEN** 用户在 100ms 内连续调整窗口大小 3 次
- **THEN** 系统只在最后一次 resize 后 150ms 更新状态
- **AND** 避免了 3 次不必要的重新渲染

#### Scenario: 四档布局模式切换
- **WHEN** 窗口宽度从小到大变化
- **THEN** 布局模式按顺序切换：mobile → compact → compressed → desktop
- **AND** 每次切换只跨越一个断点（渐进式）
- **AND** 不会跳过中间的布局模式

### Requirement: 媒体查询 Hook

系统必须提供 `useMediaQuery` Hook 用于自定义媒体查询。

#### Scenario: 使用自定义媒体查询
- **WHEN** 组件调用 `useMediaQuery('(max-width: 600px)')`
- **THEN** 系统返回布尔值表示当前窗口是否满足查询条件
- **AND** 在窗口 resize 时自动更新

#### Scenario: SSR 兼容性
- **WHEN** 组件在服务端渲染时调用 `useMediaQuery`
- **THEN** 系统返回默认值（false）避免 hydration mismatch
- **AND** 不抛出错误

### Requirement: 响应式状态直接获取

系统通过 `useResponsive()` Hook 直接获取响应式状态，无需 Provider。

#### Scenario: 应用初始化时提供响应式状态
- **WHEN** 应用启动
- **THEN** 组件可以直接调用 `useResponsive()` Hook
- **AND** Hook 内部初始化 `layoutMode` 为当前窗口宽度对应的模式
- **AND** 无需 Provider 包装

### Requirement: 响应式状态不应存入 Redux

系统不得将响应式状态（layoutMode, width, height）存入 Redux store。

#### Scenario: Redux store 中不包含响应式状态
- **WHEN** 检查 Redux store 结构
- **THEN** store 中不存在 `layoutMode`, `width`, `height` 字段
- **AND** 仅包含用户交互状态（如 `isDrawerOpen`）

#### Scenario: 避免频繁的 Redux action
- **WHEN** 窗口 resize 触发 10 次
- **THEN** Redux store 不产生任何 action
- **AND** 仅通过 Context 更新响应式状态

### Requirement: 性能优化

系统必须优化响应式状态更新的性能。

#### Scenario: 节流优化
- **WHEN** 窗口 resize 事件触发
- **THEN** 系统使用 150ms 节流间隔
- **AND** 立即响应第一次变化，然后在连续 resize 过程中每 150ms 更新一次
- **AND** 使用 es-toolkit 的 `throttle` 函数实现
- **AND** 每个媒体查询独立节流，避免互相影响

#### Scenario: 避免 Context 过度渲染
- **WHEN** 只有部分组件需要响应式状态
- **THEN** 系统使用 React.memo 或 useMemo 优化这些组件
- **AND** 只有 `layoutMode` 变化时才重新渲染

#### Scenario: 内存泄漏预防
- **WHEN** 组件卸载
- **THEN** 系统清理所有事件监听器（resize, media query）
- **AND** 不保留任何引用

### Requirement: 布局模式切换的平滑过渡

系统必须确保布局模式切换时 UI 平滑过渡，不出现跳动或闪烁。

#### Scenario: CSS 过渡动画
- **WHEN** 布局从 Desktop 切换到 Compressed
- **THEN** 侧边栏宽度变化使用 `transition-all duration-300 ease-in-out`
- **AND** 过渡动画流畅，无卡顿

#### Scenario: 避免内容跳动
- **WHEN** 布局模式切换
- **THEN** 主内容区域的位置变化最小化
- **AND** 使用 CSS Grid 或 Flexbox 避免重排

#### Scenario: 移动端抽屉动画
- **WHEN** Mobile 模式下打开抽屉
- **THEN** 抽屉从左侧滑出，使用 `transition-transform duration-300`
- **AND** 遮罩层淡入，使用 `transition-opacity duration-300`

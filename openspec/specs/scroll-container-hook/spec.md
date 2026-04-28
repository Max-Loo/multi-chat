# Scroll Container Hook

## Capability: scroll-container-hook

Provides `useScrollContainer` hook to encapsulate scroll event handling and adaptive scrollbar logic.

### Requirement: useScrollContainer hook 接口
系统 SHALL 提供 `useScrollContainer()` hook，返回 `{ scrollContainerRef: React.RefObject<HTMLDivElement>, scrollbarClassname: string }`。hook 内部 SHALL 封装 `useAdaptiveScrollbar()` 调用、ref 创建和 scroll 事件监听的绑定/解绑逻辑。

#### Scenario: hook 返回正确的属性
- **WHEN** 调用 `useScrollContainer()`
- **THEN** 返回对象 SHALL 包含 `scrollContainerRef`（`React.RefObject<HTMLDivElement>`）和 `scrollbarClassname`（`string`）

#### Scenario: scroll 事件自动绑定
- **WHEN** 组件挂载并将 `scrollContainerRef` 绑定到 DOM 元素
- **THEN** hook SHALL 自动为该元素注册 passive scroll 事件监听器

#### Scenario: scroll 事件自动解绑
- **WHEN** 组件卸载
- **THEN** hook SHALL 自动移除 scroll 事件监听器

### Requirement: KeyManagementSetting 使用 useScrollContainer
`KeyManagementSetting` 组件 SHALL 使用 `useScrollContainer()` hook 替代手动的 `useAdaptiveScrollbar` + `useRef` + `useEffect` 组合。

#### Scenario: 滚动功能不变
- **WHEN** 在密钥管理设置页面中滚动内容
- **THEN** 滚动行为和自适应滚动条样式 SHALL 与重构前完全一致

### Requirement: GeneralSetting 使用 useScrollContainer
`GeneralSetting` 组件 SHALL 使用 `useScrollContainer()` hook 替代手动的 `useAdaptiveScrollbar` + `useRef` + `useEffect` 组合。

#### Scenario: 滚动功能不变
- **WHEN** 在通用设置页面中滚动内容
- **THEN** 滚动行为和自适应滚动条样式 SHALL 与重构前完全一致

### Requirement: useScrollContainer 返回值测试

系统 SHALL 验证 `useScrollContainer()` hook 返回 `{ scrollContainerRef, scrollbarClassname }`，其中 `scrollContainerRef` 为 `React.RefObject<HTMLDivElement>`，`scrollbarClassname` 初始值为 `'scrollbar-none'`。

#### Scenario: hook 返回正确的属性类型和初始值
- **WHEN** 调用 `useScrollContainer()`
- **THEN** 返回对象 SHALL 包含 `scrollContainerRef`（非 null 的 ref 对象）和 `scrollbarClassname`（值为 `'scrollbar-none'`）

### Requirement: useScrollContainer scroll 事件自动绑定

`useScrollContainer` SHALL 在组件挂载后自动将 `onScrollEvent` 绑定到 `scrollContainerRef` 指向的 DOM 元素的 `scroll` 事件，使用 `{ passive: true }` 选项。

#### Scenario: 挂载时绑定 scroll 事件监听器
- **WHEN** 组件挂载并将 `scrollContainerRef.current` 指向一个 DOM 元素
- **THEN** 该 DOM 元素 SHALL 注册了一个 passive scroll 事件监听器

### Requirement: useScrollContainer scroll 事件自动解绑

`useScrollContainer` SHALL 在组件卸载时自动移除 `scrollContainerRef` 指向 DOM 元素上的 scroll 事件监听器，防止内存泄漏。

#### Scenario: 卸载时移除 scroll 事件监听器
- **WHEN** 组件卸载
- **THEN** DOM 元素上的 scroll 事件监听器 SHALL 被移除
- **AND** 移除的事件处理函数 SHALL 与注册时相同（同一引用）

### Requirement: useScrollContainer 滚动时切换 scrollbarClassname

当滚动事件触发时，`scrollbarClassname` SHALL 从 `'scrollbar-none'` 切换为 `'scrollbar-thin'`。

#### Scenario: 滚动触发样式切换
- **WHEN** 模拟 scroll 事件触发
- **THEN** `scrollbarClassname` SHALL 变为 `'scrollbar-thin'`

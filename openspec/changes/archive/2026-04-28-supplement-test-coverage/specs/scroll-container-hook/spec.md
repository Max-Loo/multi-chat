## ADDED Requirements

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

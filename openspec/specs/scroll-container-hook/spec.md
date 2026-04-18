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

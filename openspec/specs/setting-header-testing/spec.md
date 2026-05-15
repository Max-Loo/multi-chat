## ADDED Requirements

### Requirement: 移动端渲染菜单按钮
当 `useResponsive()` 返回 `isMobile: true` 时，SettingHeader SHALL 渲染一个菜单按钮。

#### Scenario: 移动端显示菜单按钮
- **WHEN** `isMobile` 为 `true`
- **THEN** 页面中存在可点击的菜单按钮（aria-label 对应翻译值）

#### Scenario: 桌面端不渲染 SettingHeader
- **WHEN** `isMobile` 为 `false`
- **THEN** SettingHeader 组件不被挂载（由父组件条件渲染控制）

### Requirement: 菜单按钮触发 toggleDrawer
点击移动端菜单按钮 SHALL 调用 `dispatch(toggleDrawer())`。

#### Scenario: 点击菜单按钮 dispatch toggleDrawer
- **WHEN** 用户在移动端模式下点击菜单按钮
- **THEN** Redux store 收到 `toggleDrawer()` action

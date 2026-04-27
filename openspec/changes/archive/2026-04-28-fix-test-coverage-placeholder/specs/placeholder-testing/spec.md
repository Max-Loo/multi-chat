## ADDED Requirements

### Requirement: 移动端渲染操作按钮
当 `useResponsive()` 返回 `isMobile: true` 时，Placeholder 组件 SHALL 渲染两个操作按钮：打开侧边栏按钮和新建聊天按钮。

#### Scenario: 移动端显示菜单按钮
- **WHEN** `isMobile` 为 `true`
- **THEN** 页面中存在 aria-label 为 `t($.chat.selectChatToStart)` 对应翻译值的按钮

#### Scenario: 移动端显示新建聊天按钮
- **WHEN** `isMobile` 为 `true`
- **THEN** 页面中存在 aria-label 为 `t($.navigation.openChatList)` 对应翻译值的按钮

### Requirement: 桌面端不渲染操作按钮
当 `useResponsive()` 返回 `isMobile: false` 时，Placeholder 组件 SHALL 不渲染任何操作按钮。

#### Scenario: 桌面端无操作按钮
- **WHEN** `isMobile` 为 `false`
- **THEN** 页面中不包含菜单按钮和新建聊天按钮

### Requirement: 打开侧边栏按钮触发 dispatch
点击移动端菜单按钮 SHALL 调用 `dispatch(toggleDrawer())`。

#### Scenario: 点击菜单按钮 dispatch toggleDrawer
- **WHEN** 用户在移动端模式下点击菜单按钮
- **THEN** Redux store 收到 `toggleDrawer()` action

### Requirement: 新建聊天按钮触发 createNewChat
点击移动端新建聊天按钮 SHALL 调用 `createNewChat` 函数。

#### Scenario: 点击新建聊天按钮
- **WHEN** 用户在移动端模式下点击新建聊天按钮
- **THEN** `createNewChat` 函数被调用一次

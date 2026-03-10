# 顶部栏能力规范

## ADDED Requirements

### Requirement: 顶部栏显示

顶部栏（MobileTopBar）必须仅在 Mobile 模式下显示。

#### Scenario: 仅在 Mobile 模式下显示顶部栏
- **WHEN** `layoutMode` 为 'mobile'
- **THEN** 顶部栏渲染
- **AND** 固定在页面顶部
- **AND** 高度为 56px（h-14）
- **AND** 包含汉堡菜单按钮（Menu 图标）

#### Scenario: Desktop、Compact、Compressed 模式下不显示顶部栏
- **WHEN** `layoutMode` 为 'desktop' 或 'compact' 或 'compressed'
- **THEN** 顶部栏不渲染
- **AND** 不占用布局空间
- **AND** 不显示汉堡菜单按钮

### Requirement: 汉堡菜单按钮功能

顶部栏中的汉堡菜单按钮用于打开抽屉。

#### Scenario: 点击汉堡菜单打开抽屉
- **WHEN** 用户点击汉堡菜单按钮
- **THEN** 触发 `toggleDrawer` action
- **AND** 抽屉从左侧滑出
- **AND** Redux 状态 `isDrawerOpen` 设置为 true

#### Scenario: ARIA 标签
- **WHEN** 汉堡菜单按钮渲染
- **THEN** 按钮有 `aria-label="打开聊天列表"`
- **AND** 抽屉打开时更新为 `aria-label="关闭聊天列表"`
- **AND** 使用 `aria-expanded` 表示抽屉状态

### Requirement: 顶部栏样式

顶部栏必须具有合适的样式。

#### Scenario: 顶部栏固定在顶部
- **WHEN** Mobile 模式下渲染顶部栏
- **THEN** 顶部栏固定在屏幕顶部
- **AND** 使用 `fixed top-0 left-0 right-0` 定位
- **AND** z-index 为 50（避免被其他元素遮挡）

#### Scenario: 顶部栏边框和背景
- **WHEN** 顶部栏渲染
- **THEN** 背景色为白色（`bg-white`）
- **AND** 底部边框为灰色（`border-b border-gray-200`）
- **AND** 与主内容区域视觉分离

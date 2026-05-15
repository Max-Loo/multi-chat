## ADDED Requirements

### Requirement: 移动端渲染返回按钮和菜单按钮
当 `isMobile` 为 `true` 时，系统 SHALL 渲染一个带 ArrowLeft 图标的返回按钮和一个带 Menu 图标的菜单按钮。

#### Scenario: 移动端显示两个按钮
- **WHEN** `isMobile` 为 `true` 且组件渲染
- **THEN** 页面 SHALL 包含一个 aria-label 为"返回"的返回按钮和一个 aria-label 为"打开菜单"的菜单按钮

### Requirement: 点击返回按钮导航到模型列表页
当用户在移动端点击返回按钮时，系统 SHALL 调用 `navigate("/model/table")`。

#### Scenario: 点击返回按钮触发导航
- **WHEN** `isMobile` 为 `true` 且用户点击返回按钮
- **THEN** 系统 SHALL 调用 `navigate` 并传入路径 `/model/table`

### Requirement: 点击菜单按钮切换抽屉状态
当用户在移动端点击菜单按钮时，系统 SHALL dispatch `toggleDrawer()` action。

#### Scenario: 点击菜单按钮触发抽屉切换
- **WHEN** `isMobile` 为 `true` 且用户点击菜单按钮
- **THEN** Redux store SHALL dispatch `toggleDrawer` action

### Requirement: 桌面端仅渲染标题
当 `isMobile` 为 `false` 时，系统 SHALL 仅渲染标题文本，不显示返回按钮和菜单按钮。

#### Scenario: 桌面端不显示移动端按钮
- **WHEN** `isMobile` 为 `false` 且组件渲染
- **THEN** 页面 SHALL NOT 包含返回按钮和菜单按钮，且 SHALL 包含模型标题文本

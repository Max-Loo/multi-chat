## ADDED Requirements

### Requirement: 点击侧边栏按钮触发导航
点击 SettingSidebar 中的设置项按钮 SHALL 调用 `navigate(path)` 跳转到对应路径。

#### Scenario: 点击通用设置按钮
- **WHEN** 用户点击"通用设置"按钮
- **THEN** `navigate` 被调用，参数为通用设置的路径

### Requirement: 防重复点击逻辑
点击当前已选中的设置项按钮 SHALL 不触发导航（`selectedBtnPath === path` 时直接 return）。

#### Scenario: 点击已选中的按钮不导航
- **WHEN** 当前 pathname 对应的设置项已被选中，用户再次点击该按钮
- **THEN** `navigate` 未被调用

### Requirement: 移动端样式切换
当 `isDesktop` 为 `false` 时，设置按钮 SHALL 使用移动端样式类（`h-9 text-sm`）。

#### Scenario: 移动端按钮样式
- **WHEN** `isDesktop` 为 `false`
- **THEN** 设置按钮包含 `h-9 text-sm` 类名

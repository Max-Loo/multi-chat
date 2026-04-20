## ADDED Requirements

### Requirement: modelPageSlices 正确管理抽屉状态
系统 SHALL 通过 `toggleDrawer` 和 `setIsDrawerOpen` 管理 `isDrawerOpen` 状态。

#### Scenario: 初始状态为关闭
- **WHEN** 获取 modelPageSlice 初始状态
- **THEN** `isDrawerOpen` 为 `false`

#### Scenario: toggleDrawer 切换状态
- **WHEN** 在 `isDrawerOpen: false` 状态下 dispatch `toggleDrawer`
- **THEN** `isDrawerOpen` 变为 `true`

#### Scenario: setIsDrawerOpen 直接设置状态
- **WHEN** dispatch `setIsDrawerOpen(true)`
- **THEN** `isDrawerOpen` 变为 `true`

### Requirement: settingPageSlices 正确管理抽屉状态
系统 SHALL 通过 `toggleDrawer` 和 `setIsDrawerOpen` 管理 `isDrawerOpen` 状态，行为与 modelPageSlices 一致。

#### Scenario: 初始状态为关闭
- **WHEN** 获取 settingPageSlice 初始状态
- **THEN** `isDrawerOpen` 为 `false`

#### Scenario: toggleDrawer 切换状态
- **WHEN** 在 `isDrawerOpen: false` 状态下 dispatch `toggleDrawer`
- **THEN** `isDrawerOpen` 变为 `true`

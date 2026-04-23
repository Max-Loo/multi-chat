## ADDED Requirements

### Requirement: KeyManagementSetting 组件测试
系统 SHALL 对 `KeyManagementSetting` 组件进行完整的交互测试，覆盖密钥导出、复制和数据重置流程。

#### Scenario: 密钥导出成功
- **WHEN** 用户点击导出按钮且 `exportMasterKey` 成功返回密钥字符串
- **THEN** 系统应显示密钥内容并启用复制按钮

#### Scenario: 密钥导出失败
- **WHEN** 用户点击导出按钮且 `exportMasterKey` 抛出错误
- **THEN** 系统应显示错误 toast 提示

#### Scenario: 密钥复制成功
- **WHEN** 用户点击复制按钮且 `copyToClipboard` 成功
- **THEN** 系统应显示成功 toast 并关闭导出对话框

#### Scenario: 密钥复制失败
- **WHEN** 用户点击复制按钮且 `copyToClipboard` 抛出错误
- **THEN** 系统应显示错误 toast 提示

#### Scenario: 数据重置对话框交互
- **WHEN** 用户触发数据重置操作
- **THEN** 系统应通过 `useResetDataDialog` 显示确认对话框

---

### Requirement: useResetDataDialog hook 测试
系统 SHALL 对 `useResetDataDialog` hook 进行完整的状态和交互测试，覆盖对话框生命周期和重置流程。

#### Scenario: 初始状态
- **WHEN** hook 被调用
- **THEN** `isDialogOpen` SHALL 为 `false`
- **AND** `isResetting` SHALL 为 `false`

#### Scenario: 打开对话框
- **WHEN** 调用 `setIsDialogOpen(true)`
- **THEN** `isDialogOpen` SHALL 为 `true`
- **AND** `renderResetDialog()` SHALL 返回包含确认和取消按钮的 AlertDialog

#### Scenario: 确认重置成功
- **WHEN** 调用 `handleConfirmReset` 且 `resetAllData` 成功
- **THEN** 系统应调用 `resetAllData()` 一次
- **AND** `isResetting` SHALL 在重置过程中为 `true`

#### Scenario: 确认重置失败
- **WHEN** 调用 `handleConfirmReset` 且 `resetAllData` 抛出错误
- **THEN** 系统应重置 `isResetting` 为 `false`
- **AND** 系统应重置 `isDialogOpen` 为 `false`

#### Scenario: 重置中按钮禁用
- **WHEN** `isResetting` 为 `true`
- **THEN** `renderResetDialog()` 返回的确认和取消按钮 SHALL 被禁用

## ADDED Requirements

### Requirement: FatalErrorScreen 提供密钥导入入口
当 FatalErrorScreen 的 fatal 错误来源于 masterKey 步骤时，系统 SHALL 在错误信息旁提供"导入密钥"按钮。

#### Scenario: masterKey 步骤 fatal 错误时显示导入按钮
- **GIVEN** 应用初始化过程中 masterKey 步骤产生 fatal 错误
- **AND** FatalErrorScreen 正在显示
- **WHEN** 错误的 `stepName` 为 `'masterKey'`
- **THEN** 系统 SHALL 在"刷新页面"和"重置所有数据"按钮之外，额外显示"导入密钥"按钮
- **AND** 点击"导入密钥"按钮 SHALL 打开 KeyRecoveryDialog 对话框

#### Scenario: 非 masterKey 步骤的 fatal 错误不显示导入按钮
- **GIVEN** 应用初始化过程中 fatal 错误不来源于 masterKey 步骤（如 i18n 失败）
- **WHEN** FatalErrorScreen 正在显示
- **THEN** 系统 SHALL NOT 显示"导入密钥"按钮
- **AND** 仅显示"刷新页面"和"重置所有数据"按钮

#### Scenario: FatalErrorScreen 中导入密钥成功后自动 reload
- **GIVEN** 用户在 FatalErrorScreen 中通过 KeyRecoveryDialog 成功导入密钥
- **WHEN** 密钥已存储到 keyring
- **THEN** 系统 SHALL 自动执行 `window.location.reload()`

### Requirement: 密钥重新生成 Toast 打开恢复对话框
当检测到 `masterKeyRegenerated=true` 且存在加密数据时，Toast 的"导入密钥"按钮 SHALL 打开 KeyRecoveryDialog 对话框，而非导航到设置页面。

#### Scenario: 用户点击 Toast 中的导入密钥按钮
- **GIVEN** 应用检测到密钥重新生成且存在加密数据
- **AND** Toast 正在显示"密钥已重新生成"通知
- **WHEN** 用户点击"导入密钥"按钮
- **THEN** 系统 SHALL 打开 KeyRecoveryDialog 对话框（内含密钥输入和验证功能）
- **AND** 系统 SHALL NOT 导航到设置页面

#### Scenario: Toast 恢复对话框中导入成功后自动 reload
- **GIVEN** 用户通过 Toast 触发的 KeyRecoveryDialog 成功导入密钥
- **WHEN** 密钥已存储到 keyring
- **THEN** 系统 SHALL 自动执行 `window.location.reload()`

### Requirement: KeyRecoveryDialog 共享组件
系统 SHALL 提供独立的 `KeyRecoveryDialog` 组件，包含密钥输入、格式验证、密钥匹配验证和结果反馈，供 FatalErrorScreen 和 Toast 恢复流程共用。

#### Scenario: 对话框包含密钥输入和验证流程
- **GIVEN** KeyRecoveryDialog 被打开
- **WHEN** 对话框渲染
- **THEN** 系统 SHALL 显示密钥输入框（monospace 字体）
- **AND** 系统 SHALL 显示"导入"按钮（输入为空时禁用）
- **AND** 系统 SHALL 显示安全警告提示

#### Scenario: 导入过程中显示加载状态
- **GIVEN** 用户点击"导入"按钮
- **WHEN** 系统正在验证和存储密钥
- **THEN** 系统 SHALL 禁用输入框和按钮
- **AND** 系统 SHALL 显示加载指示器

## ADDED Requirements

### Requirement: 用户可以从致命错误界面重置所有数据
系统 SHALL 在 FatalErrorScreen 中提供"重置所有数据并重新开始"按钮，允许用户在 keyring 损坏或不可访问时清除所有数据并重新初始化。

#### Scenario: 用户在致命错误界面点击重置按钮
- **GIVEN** 应用初始化因 keyring 不可访问而失败
- **AND** FatalErrorScreen 正在显示
- **WHEN** 用户点击"重置所有数据并重新开始"按钮
- **THEN** 系统 SHALL 显示确认对话框，明确告知后果："将清除所有已保存的模型配置和聊天记录，生成新的加密密钥。此操作不可撤销。"
- **AND** 确认对话框 SHALL 提供"确认重置"和"取消"两个选项

#### Scenario: 用户确认重置数据
- **GIVEN** 重置确认对话框正在显示
- **WHEN** 用户点击"确认重置"
- **THEN** 系统 SHALL 调用 `resetAllData()` 执行全量数据清除
- **AND** 系统 SHALL 自动刷新页面重新进入初始化流程
- **AND** 新初始化 SHALL 自动生成新的主密钥

#### Scenario: 用户取消重置
- **GIVEN** 重置确认对话框正在显示
- **WHEN** 用户点击"取消"
- **THEN** 系统 SHALL 关闭确认对话框
- **AND** 用户 SHALL 回到 FatalErrorScreen

### Requirement: resetAllData 函数清除全量数据
系统 SHALL 提供 `resetAllData()` 函数，清除安全基础设施和业务数据，保留应用配置。

#### Scenario: Web 环境执行全量数据重置
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** `resetAllData()` 被调用
- **THEN** 系统 SHALL 清除 localStorage 中的 `multi-chat-keyring-seed`
- **AND** 系统 SHALL 清除 localStorage 中的 `keyring-data-version`
- **AND** 系统 SHALL 清除 localStorage 中的 `multi-chat-security-warning-dismissed`
- **AND** 系统 SHALL 删除 IndexedDB 数据库 `multi-chat-keyring`
- **AND** 系统 SHALL 删除 IndexedDB 数据库 `multi-chat-store`
- **AND** 系统 SHALL 调用 `keyring.resetState()` 重置内部缓存
- **AND** 系统 SHALL 保留 localStorage 中的 `multi-chat-language`、`multi-chat-transmit-history-reasoning`、`multi-chat-auto-naming-enabled`

#### Scenario: Tauri 环境执行全量数据重置
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** `resetAllData()` 被调用
- **THEN** 系统 SHALL 调用 keyring 的 `deletePassword("com.multichat.app", "master-key")` 删除主密钥
- **AND** 系统 SHALL 通过 Store API 清除 `models.json` 中的所有数据
- **AND** 系统 SHALL 通过 Store API 清除 `chats.json` 中的所有数据
- **AND** 系统 SHALL 保留 localStorage 中的 `multi-chat-language`、`multi-chat-transmit-history-reasoning`、`multi-chat-auto-naming-enabled`

#### Scenario: 重置过程中部分步骤失败
- **GIVEN** `resetAllData()` 正在执行
- **WHEN** 某个清理步骤失败（如 IndexedDB 删除被阻塞）
- **THEN** 系统 SHALL 继续执行后续清理步骤
- **AND** 系统 SHALL 记录失败步骤的错误日志
- **AND** 最终 SHALL 仍然执行页面刷新

### Requirement: 设置页面提供数据重置入口
系统 SHALL 在设置页面提供"重置所有数据"选项，复用 `resetAllData()` 函数。

#### Scenario: 用户从设置页面触发重置
- **GIVEN** 用户已进入设置页面
- **WHEN** 用户点击"重置所有数据"按钮
- **THEN** 系统 SHALL 显示与 FatalErrorScreen 相同的确认对话框
- **AND** 确认后执行相同的 `resetAllData()` 逻辑

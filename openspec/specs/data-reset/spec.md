## ADDED Requirements

### Requirement: 用户可以从致命错误界面重置所有数据
系统 SHALL 在 FatalErrorScreen 中提供"重置所有数据并重新开始"按钮，允许用户在 keyring 损坏或不可访问时清除所有数据并重新初始化。重置确认逻辑 SHALL 通过共享 Hook 实现，确保与设置页面的重置行为一致。重置失败时 MUST 记录错误日志。

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

#### Scenario: 重置数据失败时记录错误日志
- **GIVEN** 重置确认对话框正在显示
- **WHEN** 用户点击"确认重置"后 `resetAllData()` 抛出异常
- **THEN** 系统 SHALL 通过 `console.error` 记录错误详情
- **AND** 系统 SHALL 关闭确认对话框
- **AND** 系统 SHALL 恢复按钮为可点击状态

#### Scenario: 用户取消重置
- **GIVEN** 重置确认对话框正在显示
- **WHEN** 用户点击"取消"
- **THEN** 系统 SHALL 关闭确认对话框
- **AND** 用户 SHALL 回到 FatalErrorScreen

### Requirement: resetAllData 函数清除全量数据
系统 SHALL 提供 `resetAllData()` 函数，清除安全基础设施和业务数据，保留应用配置。所有临时创建的 Store 实例 MUST 在使用完毕后关闭。

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
- **AND** 清除完成后 SHALL 调用 `store.close()` 释放文件句柄
- **AND** 系统 SHALL 通过 Store API 清除 `chats.json` 中的所有数据
- **AND** 清除完成后 SHALL 调用 `store.close()` 释放文件句柄
- **AND** 系统 SHALL 保留 localStorage 中的 `multi-chat-language`、`multi-chat-transmit-history-reasoning`、`multi-chat-auto-naming-enabled`

#### Scenario: 重置过程中部分步骤失败
- **GIVEN** `resetAllData()` 正在执行
- **WHEN** 某个清理步骤失败（如 IndexedDB 删除被阻塞）
- **THEN** 系统 SHALL 继续执行后续清理步骤
- **AND** 系统 SHALL 记录失败步骤的错误日志
- **AND** 最终 SHALL 仍然执行页面刷新

### Requirement: 设置页面提供数据重置入口
系统 SHALL 在设置页面提供"重置所有数据"选项，复用 `resetAllData()` 函数和共享的重置确认 Hook，确保与 FatalErrorScreen 行为一致。

#### Scenario: 用户从设置页面触发重置
- **GIVEN** 用户已进入设置页面
- **WHEN** 用户点击"重置所有数据"按钮
- **THEN** 系统 SHALL 显示确认对话框
- **AND** 确认后执行 `resetAllData()` 逻辑
- **AND** 重置行为 SHALL 与 FatalErrorScreen 完全一致（共享同一 Hook）

#### Scenario: 重置数据失败时记录错误日志（设置页面）
- **GIVEN** 设置页面的重置确认对话框正在显示
- **WHEN** 用户确认重置后 `resetAllData()` 抛出异常
- **THEN** 系统 SHALL 通过 `console.error` 记录错误详情
- **AND** 系统 SHALL 关闭确认对话框并恢复按钮状态

### Requirement: 重置确认逻辑通过共享 Hook 复用
系统 SHALL 提供 `useResetDataDialog` Hook，封装重置确认对话框的状态管理、操作逻辑和 UI 渲染，供 FatalErrorScreen 和 KeyManagementSetting 共同使用。

#### Scenario: Hook 提供完整的状态、操作和渲染接口
- **WHEN** 组件调用 `useResetDataDialog()`
- **THEN** Hook SHALL 返回 `{ isDialogOpen, setIsDialogOpen, isResetting, handleConfirmReset, renderResetDialog }`
- **AND** `handleConfirmReset` SHALL 执行 `resetAllData()` → `window.location.reload()` 流程
- **AND** `handleConfirmReset` 失败时 SHALL 通过 `console.error` 记录错误并重置状态
- **AND** `renderResetDialog` SHALL 返回完整的重置确认 AlertDialog JSX（包含确认和取消按钮）

#### Scenario: 两处消费点使用相同的对话框 UI
- **GIVEN** `KeyManagementSetting` 和 `FatalErrorScreen` 均使用 `useResetDataDialog` Hook
- **WHEN** 各自调用 `renderResetDialog()`
- **THEN** 两处 SHALL 渲染完全相同的 AlertDialog UI
- **AND** 对话框 SHALL 使用相同的 i18n key（`common.resetConfirmTitle`、`common.resetConfirmDescription`、`common.resetConfirmAction`、`common.cancel`）
- **AND** 确认按钮 SHALL 使用 destructive 样式

### Requirement: 存储常量统一引用
`resetAllData()` 中使用的存储 key 和数据库名 MUST 通过导入已有模块的导出常量获取，禁止硬编码字符串。安全性警告的 localStorage key SHALL 在 `masterKey.ts` 中导出为命名常量，供 `resetAllData.ts` 引用。

#### Scenario: resetAllData 引用 keyring 模块的常量
- **WHEN** `resetAllData()` 需要访问 localStorage key 或 IndexedDB 数据库名
- **THEN** 系统 SHALL 从 `keyring.ts` 和 `keyringMigration.ts` 导入已定义的常量
- **AND** 严禁在 `resetAllData.ts` 中独立硬编码相同的字符串值

#### Scenario: 安全性警告 key 常量共享
- **WHEN** `resetAllData.ts` 需要清除安全性警告的 localStorage key
- **THEN** 系统 SHALL 从 `masterKey.ts` 导入 `SECURITY_WARNING_DISMISSED_KEY` 常量
- **AND** 该常量 SHALL 与 `masterKey.ts` 中 `handleSecurityWarning` 使用的 key 字符串一致

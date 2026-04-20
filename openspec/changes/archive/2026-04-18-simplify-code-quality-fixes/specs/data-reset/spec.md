## MODIFIED Requirements

### Requirement: resetAllData 函数清除全量数据
系统 SHALL 提供 `resetAllData()` 函数，清除安全基础设施和业务数据，保留应用配置。所有临时创建的 Store 实例 MUST 在使用完毕后关闭。

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

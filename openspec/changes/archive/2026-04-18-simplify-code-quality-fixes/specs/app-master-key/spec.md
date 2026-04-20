## MODIFIED Requirements

### Requirement: 跨环境主密钥存储策略
系统 SHALL 根据运行环境自动选择主密钥存储策略，对开发者透明。所有临时创建的 Store 实例 MUST 在使用完毕后关闭，防止文件句柄泄漏和连接冲突。

#### Scenario: 自动选择存储策略
- **WHEN** 应用初始化主密钥存储
- **THEN** 系统 SHALL 检测运行环境（通过 `isTauri()`）
- **AND** Tauri 环境使用 `@tauri-plugin-keyring-api` 原生实现
- **AND** Web 环境使用 Keyring 兼容层（IndexedDB + 加密）
- **AND** 调用者无需关心底层实现差异

#### Scenario: 密钥验证的 Store 生命周期
- **WHEN** `verifyMasterKey()` 执行密钥验证操作
- **THEN** 系统 SHALL 创建独立的 Store 实例读取模型数据
- **AND** 验证完成后（无论成功或失败）SHALL 关闭该 Store 实例
- **AND** 系统 SHALL 使用 try/finally 确保 Store 在异常时也被关闭
- **AND** 验证期间 SHALL 不影响 `modelStorage` 的模块级单例

### Requirement: 主密钥存储错误处理
系统 SHALL 提供健壮的错误处理机制，确保主密钥存储失败时的优雅降级。初始化步骤的 `onError` 回调 SHALL NOT 手动设置 `stepName`——`InitializationManager` SHALL 在调用 `onError` 后自动注入 `stepName = step.name`。

#### Scenario: 初始化步骤错误自动关联步骤名
- **GIVEN** 初始化步骤定义了 `onError` 回调
- **WHEN** 步骤执行失败且 `onError` 被调用
- **THEN** `InitializationManager` SHALL 自动设置返回的 `InitError.stepName = step.name`
- **AND** 各步骤的 `onError` 回调 SHALL NOT 包含 `stepName` 字段

#### Scenario: FatalErrorScreen 使用步骤名常量
- **GIVEN** `FatalErrorScreen` 需要检测 masterKey 步骤的错误
- **WHEN** 代码引用步骤名进行比较
- **THEN** 系统 SHALL 使用从 `initSteps.ts` 导出的常量（如 `MASTER_KEY_STEP_NAME`）
- **AND** 严禁使用硬编码字符串 `'masterKey'`

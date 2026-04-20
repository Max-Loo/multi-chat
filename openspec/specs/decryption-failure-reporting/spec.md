## ADDED Requirements

### Requirement: 解密失败时保留加密原始值
当 `decryptModelSensitiveFields` 解密失败时，系统 SHALL 保留该字段的原始 `enc:` 加密值，不置空。

#### Scenario: 单个模型解密失败
- **GIVEN** 持久化存储中存在带有 `enc:` 前缀 apiKey 的模型
- **WHEN** 使用错误的主密钥解密该模型
- **THEN** 系统 SHALL 保留该模型的 `apiKey` 为原始 `enc:xxx` 值
- **AND** 系统 SHALL 记录错误日志

#### Scenario: 多个模型中部分解密失败
- **GIVEN** 持久化存储中存在 3 个模型，其中 2 个的 apiKey 使用旧密钥加密
- **WHEN** 使用新密钥解密所有模型
- **THEN** 成功解密的 2 个模型 SHALL 返回明文 apiKey
- **AND** 失败的 1 个模型 SHALL 保留原始 `enc:xxx` 值

### Requirement: loadModelsFromJson 返回解密失败统计
`loadModelsFromJson` SHALL 返回结构化结果，包含模型列表和解密失败数量。

#### Scenario: 所有模型解密成功
- **WHEN** 调用 `loadModelsFromJson` 且所有加密字段均解密成功
- **THEN** 系统 SHALL 返回 `{ models: Model[], decryptionFailureCount: 0 }`

#### Scenario: 存在解密失败
- **WHEN** 调用 `loadModelsFromJson` 且 3 个模型中有 2 个解密失败
- **THEN** 系统 SHALL 返回 `{ models: Model[], decryptionFailureCount: 2 }`

#### Scenario: 无模型数据
- **WHEN** 调用 `loadModelsFromJson` 且 Store 中无模型数据
- **THEN** 系统 SHALL 返回 `{ models: [], decryptionFailureCount: 0 }`

#### Scenario: 主密钥不存在
- **WHEN** 调用 `loadModelsFromJson` 且 `getMasterKey()` 返回 null
- **THEN** 系统 SHALL 返回带空 apiKey 的模型列表（对加密字段置空）
- **AND** 系统 SHALL 返回 `decryptionFailureCount: 0`（因为未尝试解密，不算失败）

### Requirement: 解密失败统计通过 InitResult 传递到 UI 层
系统 SHALL 通过 `InitResult.decryptionFailureCount` 字段将解密失败数量传递到 UI 层。

#### Scenario: models 步骤检测到解密失败
- **GIVEN** `loadModelsFromJson` 返回 `decryptionFailureCount > 0`
- **WHEN** models 初始化步骤执行
- **THEN** 系统 SHALL 将 `decryptionFailureCount` 存入 context
- **AND** `InitializationManager` SHALL 将其提取到 `InitResult.decryptionFailureCount`

#### Scenario: 无解密失败
- **GIVEN** `loadModelsFromJson` 返回 `decryptionFailureCount = 0`
- **WHEN** 初始化完成
- **THEN** `InitResult.decryptionFailureCount` SHALL 为 0

### Requirement: 解密失败时显示恢复通知
当 `InitResult.decryptionFailureCount > 0` 时，系统 SHALL 显示持续通知引导用户恢复，并在通知中附带密钥恢复操作按钮。

#### Scenario: 检测到解密失败
- **GIVEN** 应用初始化完成且 `InitResult.decryptionFailureCount > 0`
- **WHEN** `MainApp` 渲染
- **THEN** 系统 SHALL 显示 Toast 警告通知
- **AND** 通知 SHALL 包含失败模型数量信息
- **AND** 通知 SHALL 设为不自动消失（`duration: Infinity`）
- **AND** 通知 SHALL 提供"导入密钥"操作按钮
- **AND** 点击"导入密钥"按钮 SHALL 打开 `KeyRecoveryDialog`

#### Scenario: 同时存在密钥重新生成和解密失败
- **GIVEN** `InitResult.masterKeyRegenerated = true` 且 `InitResult.decryptionFailureCount > 0`
- **WHEN** `MainApp` 渲染
- **THEN** 系统 SHALL 只显示解密失败通知
- **AND** 解密失败通知中的"导入密钥"按钮 SHALL 同时覆盖密钥重新生成的恢复需求
- **AND** 系统 SHALL 不再调用 `hasEncryptedModels()`（该检查在 `decryptionFailureCount > 0` 条件下为冗余死代码）

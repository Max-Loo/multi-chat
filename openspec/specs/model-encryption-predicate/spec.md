# Model Encryption Predicate

## Capability: model-encryption-predicate

Provides unified encryption detection for model data via `isModelEncrypted` and shared store access.

### Requirement: isModelEncrypted 工具函数
系统 SHALL 在 `src/store/storage/modelStorage.ts` 中导出 `isModelEncrypted(model: Model): boolean` 函数，当 `model.apiKey` 存在、类型为 `string` 且 `isEncrypted(model.apiKey)` 返回 `true` 时返回 `true`，否则返回 `false`。

#### Scenario: 模型有加密的 apiKey
- **WHEN** 调用 `isModelEncrypted(model)` 且 `model.apiKey` 为 `"enc:..."` 格式的加密字符串
- **THEN** 函数 SHALL 返回 `true`

#### Scenario: 模型有明文 apiKey
- **WHEN** 调用 `isModelEncrypted(model)` 且 `model.apiKey` 为普通字符串
- **THEN** 函数 SHALL 返回 `false`

#### Scenario: 模型无 apiKey
- **WHEN** 调用 `isModelEncrypted(model)` 且 `model.apiKey` 为 `undefined` 或空字符串
- **THEN** 函数 SHALL 返回 `false`

### Requirement: keyVerification 复用 modelStorage 的 store
`keyVerification.ts` SHALL 导入 `getModelsStore()` 和 `resetModelsStore()` 而非维护独立的 `verificationStore` 单例。

#### Scenario: verifyMasterKey 使用共享 store
- **WHEN** `verifyMasterKey(key)` 被调用
- **THEN** 函数 SHALL 通过 `getModelsStore()` 获取 store 实例进行只读操作

#### Scenario: 重置函数委托给 modelStorage
- **WHEN** 测试代码调用 `resetVerificationStore()`
- **THEN** 该函数 SHALL 委托调用 `resetModelsStore()`

### Requirement: 统一使用 isEncrypted 检测
`modelStorage.ts` 中所有对 `"enc:"` 前缀的检测 SHALL 使用 `isEncrypted()` 工具函数，而非直接调用 `startsWith("enc:")`。

#### Scenario: encryptModelSensitiveFields 中使用 isEncrypted
- **WHEN** 查看 `encryptModelSensitiveFields` 函数
- **THEN** 加密前检测 SHALL 使用 `isEncrypted(model.apiKey)` 而非 `model.apiKey.startsWith("enc:")`

#### Scenario: decryptModelSensitiveFields 中使用 isEncrypted
- **WHEN** 查看 `decryptModelSensitiveFields` 函数
- **THEN** 解密前检测 SHALL 使用 `isEncrypted(model.apiKey)` 而非 `model.apiKey.startsWith("enc:")`

#### Scenario: hasEncryptedModels 使用 isModelEncrypted
- **WHEN** 查看 `hasEncryptedModels` 函数
- **THEN** 加密检测 SHALL 使用 `isModelEncrypted(model)` 而非内联谓词

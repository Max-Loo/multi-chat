## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 isMigrationToV2Complete localStorage 异常路径
测试套件 SHALL 杀死 `try { localStorage.getItem } catch { return false }` 的条件变异体。

#### Scenario: localStorage 读取异常返回 false
- **WHEN** localStorage.getItem 抛出异常
- **THEN** SHALL isMigrationToV2Complete() 返回 false（不抛出异常）

### Requirement: 变异测试 SHALL 验证 migrateKeyringV1ToV2 提前返回路径
测试套件 SHALL 杀死 `typeof indexedDB === 'undefined'` 和 `typeof localStorage === 'undefined'` 的条件变异体。

#### Scenario: indexedDB 不可用时跳过迁移
- **WHEN** indexedDB 为 undefined
- **THEN** SHALL 返回 { migrated: false, reset: false } 并标记迁移完成

#### Scenario: localStorage 不可用时跳过迁移
- **WHEN** localStorage 为 undefined
- **THEN** SHALL 返回 { migrated: false, reset: false } 并标记迁移完成

### Requirement: 变异测试 SHALL 验证 deriveEncryptionKeyV1 使用 userAgent
测试套件 SHALL 杀死 `navigator.userAgent + seed` 的字符串拼接变异体。

#### Scenario: V1 密钥派生使用 userAgent + seed
- **WHEN** 调用 deriveEncryptionKeyV1(seed)
- **THEN** SHALL crypto.subtle.importKey 的输入数据包含 navigator.userAgent 和 seed 的编码

### Requirement: 变异测试 SHALL 验证 deriveEncryptionKeyV2 仅使用 seed
测试套件 SHALL 杀死 `keyMaterial = seed` 的赋值变异体。

#### Scenario: V2 密钥派生仅使用 seed
- **WHEN** 调用 deriveEncryptionKeyV2(seed)
- **THEN** SHALL crypto.subtle.importKey 的输入数据仅包含 seed 的编码（不含 userAgent）

### Requirement: 变异测试 SHALL 验证 PBKDF2 参数传递
测试套件 SHALL 杀死 `iterations: getPBKDF2Iterations()` 和 `extractable: false` 的参数变异体。

#### Scenario: deriveKey 使用正确的 iterations
- **WHEN** 调用 deriveEncryptionKeyV2(seed)
- **THEN** SHALL crypto.subtle.deriveKey 的参数中 iterations 等于 getPBKDF2Iterations() 的返回值

#### Scenario: importKey 设置 extractable 为 false
- **WHEN** 调用 deriveEncryptionKeyV2(seed)
- **THEN** SHALL crypto.subtle.importKey 的 extractable 参数为 false

#### Scenario: deriveKey 设置 extractable 为 false
- **WHEN** 调用 deriveEncryptionKeyV2(seed)
- **THEN** SHALL crypto.subtle.deriveKey 的 key 提取参数为 false

### Requirement: 变异测试 SHALL 验证迁移成功后数据完整性
测试套件 SHALL 杀死 `clearStore` + `putRecord` 循环写入的调用变异体。

#### Scenario: 迁移成功后记录使用 V2 密钥重新加密
- **WHEN** V1→V2 迁移成功完成
- **THEN** SHALL IndexedDB 中的记录能被 V2 密钥解密、不能被 V1 密钥解密

#### Scenario: 迁移成功后 keyring 状态被重置
- **WHEN** V1→V2 迁移成功完成
- **THEN** SHALL keyring.resetState() 被调用

### Requirement: 变异测试 SHALL 验证迁移失败重置路径
测试套件 SHALL 杀死 `clearAllKeyringData()` + `generateNewSeed()` 的调用变异体。

#### Scenario: 迁移失败后生成新种子
- **WHEN** V1 解密失败
- **THEN** SHALL localStorage 中的种子与旧种子不同

#### Scenario: 迁移失败后 keyring 状态被重置
- **WHEN** V1 解密失败
- **THEN** SHALL keyring.resetState() 被调用

### Requirement: 变异测试 SHALL 验证 noMigrationNeeded 返回值
测试套件 SHALL 杀死 `{ migrated: false, reset: false }` 的对象字面量变异体。

#### Scenario: 无需迁移时返回正确结构
- **WHEN** 调用 migrateKeyringV1ToV2 且无需迁移
- **THEN** SHALL 返回 { migrated: false, reset: false }

### Requirement: 变异测试 SHALL 验证 markMigrationComplete 写入版本
测试套件 SHALL 杀死 `localStorage.setItem(KEYRING_VERSION_KEY, KEYRING_CURRENT_VERSION)` 的参数变异体。

#### Scenario: 迁移完成后版本标记为 "2"
- **WHEN** 任何路径调用 migrateKeyringV1ToV2 完成后
- **THEN** SHALL localStorage.getItem('keyring-data-version') 返回 '2'

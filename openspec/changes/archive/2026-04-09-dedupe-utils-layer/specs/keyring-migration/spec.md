## MODIFIED Requirements

### Requirement: Keyring 迁移模块使用共享模块

keyringMigration 模块的内部实现 SHALL 从共享模块导入 `initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`、`isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量，而非在本地定义这些函数和常量。

#### Scenario: V1→V2 迁移行为不变
- **WHEN** 执行 keyring V1 到 V2 的迁移流程
- **THEN** 迁移逻辑和结果与重构前完全一致，成功迁移后数据可正常解密

#### Scenario: 公开 API 不变
- **WHEN** 上层代码调用 `migrateKeyringV1ToV2`
- **THEN** 函数签名和返回行为保持不变

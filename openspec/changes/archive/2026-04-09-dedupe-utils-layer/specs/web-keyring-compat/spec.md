## MODIFIED Requirements

### Requirement: Web Keyring 内部实现使用共享模块

WebKeyringCompat 的内部实现 SHALL 从共享模块导入 `initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`、`isTestEnvironment`、`getPBKDF2Iterations` 及 PBKDF2 常量，而非在本地定义这些函数和常量。

#### Scenario: keyring 功能不变
- **WHEN** 通过 WebKeyringCompat 进行密钥的 set/get/delete 操作
- **THEN** 行为与重构前完全一致，加密数据格式不变，可正确读写已有数据

#### Scenario: 公开 API 不变
- **WHEN** 上层代码通过 `@/utils/tauriCompat` 导入 keyring 相关 API
- **THEN** 所有导出的函数签名和类型保持不变

## MODIFIED Requirements

### Requirement: 密码读取或解密失败错误处理
测试 SHALL 覆盖 keyring 中密码读取和解密失败时的错误处理路径。

#### Scenario: 密码读取失败抛出明确错误
- **WHEN** 从存储读取密码数据失败
- **THEN** 抛出包含原因的错误对象，不静默返回空值

### Requirement: IndexedDB 不可用时静默失败
测试 SHALL 覆盖 IndexedDB 不可用时 keyring 迁移的降级行为。

#### Scenario: IndexedDB 不可用时迁移静默跳过
- **WHEN** `indexedDB` 全局对象不可用
- **THEN** 迁移流程静默完成，不抛出异常，不影响主密钥操作

### Requirement: 无 IndexedDB 记录时跳过迁移
测试 SHALL 覆盖 IndexedDB 中无历史记录时的迁移边界条件。

#### Scenario: 无历史记录时跳过迁移
- **WHEN** IndexedDB 可用但无 `keyring-store` 记录
- **THEN** 迁移流程正常完成，不创建新记录

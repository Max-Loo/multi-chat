## MODIFIED Requirements

### Requirement: isEncrypted 测试实际调用被测函数

名为验证 `isEncrypted()` 的测试 MUST 导入并调用 `isEncrypted` 函数，MUST NOT 使用内联的 `value.startsWith('enc:')` 替代。

#### Scenario: isEncrypted 测试调用真实函数

- **WHEN** 测试名为 `isEncrypted() 对恶意输入的防御` 或 `isEncrypted() 对各种输入的判断`
- **THEN** 测试 SHALL 导入 `isEncrypted` 并用 `isEncrypted(value)` 替换 `value.startsWith('enc:')`

#### Scenario: isEncrypted 函数不存在时的处理

- **WHEN** `@/utils/crypto` 中不存在 `isEncrypted` 导出
- **THEN** SHALL 先在 `crypto.ts` 中创建 `isEncrypted` 函数（检查 `enc:` 前缀），再编写测试

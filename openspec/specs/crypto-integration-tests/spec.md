## Requirements

### Requirement: isEncrypted 测试实际调用被测函数

名为验证 `isEncrypted()` 的测试 MUST 导入并调用 `isEncrypted` 函数，MUST NOT 使用内联的 `value.startsWith('enc:')` 替代。

#### Scenario: isEncrypted 测试调用真实函数

- **WHEN** 测试名为 `isEncrypted() 对恶意输入的防御` 或 `isEncrypted() 对各种输入的判断`
- **THEN** 测试 SHALL 导入 `isEncrypted` 并用 `isEncrypted(value)` 替换 `value.startsWith('enc:')`

#### Scenario: isEncrypted 函数不存在时的处理

- **WHEN** `@/utils/crypto` 中不存在 `isEncrypted` 导出
- **THEN** SHALL 先在 `crypto.ts` 中创建 `isEncrypted` 函数（检查 `enc:` 前缀），再编写测试

### Requirement: crypto-storage 测试分类为单元测试

`crypto-storage.integration.test.ts` SHALL 从 `src/__test__/integration/` 目录移动到 `src/__test__/utils/` 目录并重命名为 `crypto-storage.test.ts`。该文件仅测试 `encryptField`/`decryptField` 纯函数，不涉及跨模块协作，属于单元测试。

#### Scenario: 文件移动到正确目录
- **WHEN** `crypto-storage` 测试仅涉及加密/解密纯函数
- **THEN** SHALL 位于 `src/__test__/utils/crypto-storage.test.ts`，文件内容不变

### Requirement: 密钥导出失败路径测试
`crypto-masterkey.integration.test.ts` 中的密钥导出失败用例 SHALL 保留 skip 状态但补充详细的跳过原因注释，说明环境限制。

#### Scenario: 跳过用例注释规范
- **WHEN** 测试因 `fake-indexedDB` mock 死锁无法执行
- **THEN** skip 注释 SHALL 说明：具体的环境限制（fake-indexedDB 版本）、已验证的替代方式（生产环境验证）、解除条件（环境升级或 mock 改进）

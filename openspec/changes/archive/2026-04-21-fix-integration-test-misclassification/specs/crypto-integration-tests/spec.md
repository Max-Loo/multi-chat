## MODIFIED Requirements

### Requirement: crypto-storage 测试分类为单元测试

`crypto-storage.integration.test.ts` SHALL 从 `src/__test__/integration/` 目录移动到 `src/__test__/utils/` 目录并重命名为 `crypto-storage.test.ts`。该文件仅测试 `encryptField`/`decryptField` 纯函数，不涉及跨模块协作，属于单元测试。

#### Scenario: 文件移动到正确目录
- **WHEN** `crypto-storage` 测试仅涉及加密/解密纯函数
- **THEN** SHALL 位于 `src/__test__/utils/crypto-storage.test.ts`，文件内容不变

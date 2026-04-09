## Why

`crypto-helpers.ts` 中手写的 `btoa(String.fromCharCode(...new Uint8Array()))` base64 编解码存在栈溢出风险（展开运算符参数上限 ~65535），而项目已有经过测试的 `bytesToBase64`/`base64ToBytes` 工具函数（`src/utils/crypto.ts`）使用了更安全的 `Array.from().join("")` 方式。应统一复用已有工具，消除重复代码和潜在隐患。

## What Changes

- 将 `crypto-helpers.ts`（encrypt/decrypt）和 `keyring.ts`/`keyringMigration.ts` 中残留的手写 base64 编解码替换为 `bytesToBase64`/`base64ToBytes` 导入
- 更新 `crypto.ts` 中 `bytesToBase64`/`base64ToBytes` 的 `@internal` 注释，反映其新的共享用途

## Capabilities

### New Capabilities

（无新能力引入）

### Modified Capabilities

- `field-level-encryption`: 加解密函数的 base64 编解码实现方式变更（行为不变，内部实现统一为共享工具函数）

## Impact

- **代码文件**：`src/utils/tauriCompat/crypto-helpers.ts`、`src/utils/tauriCompat/keyring.ts`、`src/utils/tauriCompat/keyringMigration.ts`、`src/utils/crypto.ts`
- **依赖关系**：`crypto-helpers.ts` 将新增对 `@/utils/crypto.ts` 的导入，需确认无循环依赖
- **公共 API**：无变化，加密/解密函数签名和返回格式保持一致

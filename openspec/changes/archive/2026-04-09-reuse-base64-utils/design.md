## Context

`crypto-helpers.ts`（tauriCompat 共享模块）中的 `encrypt`/`decrypt` 函数手写了 `btoa(String.fromCharCode(...uint8Array))` 进行 base64 编解码。展开运算符将数组每个元素作为独立参数传递，当加密数据超过 ~65KB 时会触发 `RangeError: Maximum call stack size exceeded`。

项目 `src/utils/crypto.ts` 已有 `bytesToBase64`（使用 `Array.from().join("")` 安全拼接）和 `base64ToBytes`（含错误处理），且 `crypto.ts` 无外部模块导入，不存在循环依赖风险。

## Goals / Non-Goals

**Goals:**
- 消除 `crypto-helpers.ts`、`keyring.ts`、`keyringMigration.ts` 中手写的 base64 编解码代码
- 统一使用 `bytesToBase64`/`base64ToBytes` 工具函数
- 修复大数据量下的栈溢出风险

**Non-Goals:**
- 不改变加密/解密的函数签名和返回格式
- 不改变 `crypto.ts` 中 `encryptField`/`decryptField` 的 `enc:` 前缀格式
- 不统一 `crypto.ts` 和 `crypto-helpers.ts` 的加密方案（两者用途不同：前者用于应用层字段加密，后者用于 keyring 内部密码存储）

## Decisions

### 决策 1：从 `@/utils/crypto.ts` 导入 `bytesToBase64`/`base64ToBytes`

**选择**：直接导入现有工具函数
**替代方案**：在 `crypto-helpers.ts` 内部重写安全版本 → 拒绝，因为项目中已有经过测试的实现
**理由**：`crypto.ts` 无外部导入，`crypto-helpers.ts` 位于 `tauriCompat/` 子目录，导入链为 `tauriCompat/crypto-helpers → utils/crypto`，无循环依赖风险。

### 决策 2：更新 `@internal` 注释

**选择**：将 `bytesToBase64`/`base64ToBytes` 的注释从 `@internal 此函数内部使用，导出仅用于测试` 更新为反映其跨模块共享用途
**理由**：这两个函数现在被 `crypto-helpers.ts` 正式使用，不再是"仅用于测试"的导出。

## Risks / Trade-offs

- **[低风险] 新增跨目录导入**：`tauriCompat/crypto-helpers.ts` → `utils/crypto.ts` 增加了模块间耦合 → 缓解：`crypto.ts` 是底层工具模块，无外部依赖，稳定性高
- **[无风险] 行为兼容**：`bytesToBase64` 的 base64 编码结果与 `btoa(String.fromCharCode(...))` 完全一致，解码同理

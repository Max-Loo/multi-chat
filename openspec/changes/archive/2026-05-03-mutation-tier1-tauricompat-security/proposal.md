## Why

`keyring.ts`（376 行）和 `keyringMigration.ts`（396 行）是项目安全核心模块，合计 772 行代码。两者都涉及 PBKDF2 密钥派生、AES-GCM 加解密、IndexedDB 事务管理和双环境（Tauri/Web）适配。当前这两个文件有完善的单元测试，但**未纳入 Stryker 变异测试**，无法验证测试套件对条件分支、边界值和错误路径的实际覆盖质量。

这两个模块风险最高：
- `keyringMigration.ts` 的 V1→V2 迁移条件分支多，漏覆盖 = 用户数据丢失
- `keyring.ts` 的密钥派生参数（iterations、salt、extractable）变异 = 安全漏洞
- IndexedDB 事务边界变异 = 数据一致性破坏

## What Changes

- 将 `src/utils/tauriCompat/keyring.ts` 和 `src/utils/tauriCompat/keyringMigration.ts` 添加到 `stryker.config.json` 的 `mutate` 数组
- 运行变异测试基线，统计存活变异体
- 针对存活变异体补充精确断言，目标杀死率 ≥ 90%

### 预期变异热点

**keyringMigration.ts（396 行）**：
- `isMigrationToV2Complete()` 的 localStorage 读取条件分支
- `migrateKeyringV1ToV2()` 的 6 个提前返回路径（isTauri、已迁移、无 indexedDB、无 localStorage、无种子、无记录）
- `deriveEncryptionKeyV1()` vs `deriveEncryptionKeyV2()` 的 keyMaterial 差异（userAgent+seed vs seed-only）
- V1 解密失败时的 `clearAllKeyringData()` + `generateNewSeed()` 重置路径
- 迁移成功后的 `clearStore` + `putRecord` 循环写入

**keyring.ts（376 行）**：
- `WebKeyringCompat.init()` 的种子变化检测 `this.currentSeed !== seed`
- `setPassword` / `getPassword` / `deletePassword` 的 IndexedDB 事务 CRUD
- `isSupported()` 的三元条件检测 `typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined'`
- `createKeyringAPI` 的 duck typing `resetState` 分发 `'resetState' in impl`
- `TauriKeyringCompat` vs `WebKeyringCompat` 的环境分发

## Capabilities

### New Capabilities

- `keyring-mutation-coverage`: keyring.ts 变异测试覆盖，目标杀死率 ≥ 90%
- `keyring-migration-mutation-coverage`: keyringMigration.ts 变异测试覆盖，目标杀死率 ≥ 90%

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令（如 `pnpm test:mutation --mutate "src/utils/tauriCompat/keyring.ts"`），不运行全量变异测试
- 加密相关的布尔参数变异（如 `extractable: false` → `true`）需通过 mock `crypto.subtle.importKey` 的调用参数来验证，不能通过加密结果间接断言
- IndexedDB 相关测试使用 `fake-indexeddb` 模拟，确保事务行为可预测

## Impact

- **测试文件**: `src/__test__/utils/tauriCompat/keyring.test.ts`（+若干用例）、`src/__test__/utils/tauriCompat/keyringMigration.test.ts`（+若干用例）
- **源代码**: 无改动
- **构建时间**: 增加可忽略
- **CI/CD**: 无影响

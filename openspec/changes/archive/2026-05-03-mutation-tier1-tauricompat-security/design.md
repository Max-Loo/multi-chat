## Context

keyring.ts（376 行）和 keyringMigration.ts（396 行）是项目安全核心，合计 772 行代码。两者涉及 PBKDF2 密钥派生、AES-GCM 加解密、IndexedDB 事务管理和双环境适配。

现有测试模式：
- keyring.test.ts：通过 `vi.mock` 控制 isTauri/keyring-api，使用 fake-indexeddb 模拟 IndexedDB，覆盖了 Tauri/Web 双环境的 CRUD 和加密解密 roundtrip
- keyringMigration.test.ts：通过 localStorage + fake-indexeddb 构造迁移前状态，覆盖了新用户/已迁移/V1→V2 成功/失败重置/Tauri 跳过等主要路径

差距分析：
- keyring.test.ts 中 `isSupported()` 在 Web 无 IndexedDB 场景仅检查 `typeof`，未断言精确布尔值
- `resetState()` / `close()` 行为未验证
- `createKeyringAPI` 的 duck typing 分发未测试
- `WebKeyringCompat.init()` 的种子变化检测路径未覆盖
- keyringMigration.test.ts 中 `isMigrationToV2Complete()` 的 localStorage 异常路径未测试
- `deriveEncryptionKeyV1/V2` 的 PBKDF2 参数（extractable、iterations）未通过 mock 验证

## Goals / Non-Goals

**Goals:**
- 将 2 个文件加入 Stryker 变异测试配置
- 运行基线测试，识别存活变异体
- 补充精确断言，目标杀死率 ≥ 90%
- 不修改任何源代码

**Non-Goals:**
- 不重构源代码或测试架构
- 不追求 100% 杀死率
- 不调整 Stryker 全局配置

## Decisions

### 1. keyring.ts：补充环境分发和状态管理断言

**决策**：补充 resetState/close 行为验证、isSupported 精确布尔值、createKeyringAPI duck typing 分发

**理由**：
- `resetState()` 在 Tauri 环境是空操作、Web 环境关闭 DB 并清除密钥，变异可能将空操作变为实际操作（反之亦然）
- `isSupported()` 的 `typeof indexedDB !== 'undefined' && typeof crypto !== 'undefined'` 是多条件 AND，需要分别断言 true/false
- `createKeyringAPI` 的 `'resetState' in impl` 是 duck typing，Tauri 实例没有 resetState 方法，调用 resetState 不应报错

**关键变异热点与应对**：
- `isSupported()` AND 条件 → 分别测试：有 IndexedDB + 有 Crypto = true、无 IndexedDB = false
- `resetState()` / `close()` → 测试 Web 环境 resetState 后 setPassword 需要重新初始化
- `createKeyringAPI` duck typing → 测试 Tauri 环境 resetState 不抛错、Web 环境 resetState 关闭 DB
- `WebKeyringCompat.init()` 种子变化 → 测试同一实例两次 init 使用不同种子

### 2. keyringMigration.ts：补充提前返回路径和参数验证

**决策**：补充 localStorage 不可用路径、deriveEncryptionKey 参数验证、迁移成功路径的数据完整性验证

**理由**：
- `isMigrationToV2Complete()` 的 try/catch 在 localStorage 不可用时返回 false，这个路径未测试
- `migrateKeyringV1ToV2()` 的 `typeof localStorage === 'undefined'` 路径未测试
- `deriveEncryptionKeyV1` 的 keyMaterial 包含 `navigator.userAgent + seed`，而 V2 只有 `seed`，需要验证这个差异
- PBKDF2 的 `extractable: false` 和 `iterations: getPBKDF2Iterations()` 需要通过 mock 验证

**关键变异热点与应对**：
- `isMigrationToV2Complete()` localStorage 异常 → stub localStorage.getItem 抛错，验证返回 false
- `typeof localStorage === 'undefined'` 路径 → stub localStorage 为 undefined
- `deriveEncryptionKeyV1` vs `V2` keyMaterial 差异 → 验证 V1 使用更长输入（userAgent+seed）而 V2 仅 seed
- PBKDF2 参数验证 → mock `crypto.subtle.importKey` 和 `crypto.subtle.deriveKey`，验证 iterations、extractable 等参数
- `noMigrationNeeded()` 返回值 → 验证 { migrated: false, reset: false }
- 迁移成功后记录写入 → 验证 clearStore + putRecord 后 IndexedDB 中的记录使用 V2 密钥加密

### 3. 分批运行变异测试

**决策**：每个文件独立运行 Stryker

**理由**：772 行合计，独立运行便于定位问题

## Risks / Trade-offs

- **[加密参数 mock]** `extractable: false` 变异需要 mock `crypto.subtle.importKey` 捕获参数，但 Web Crypto API 在测试环境中可能行为不同 → 使用 `vi.spyOn` 在 import 之前拦截
- **[localStorage 不可用]** `typeof localStorage === 'undefined'` 在 happy-dom 中默认可用，需要 `vi.stubGlobal('localStorage', undefined)` → 需注意 stub 时机（import 前）
- **[解密失败测试]** keyring.test.ts 中解密失败测试已标记 skip（happy-dom 环境限制），变异测试可能在该区域有存活变异体 → 接受等价变异体
- **[等价变异体]** `noMigrationNeeded()` 的 `console.log` 调用属于副作用，不影响返回值 → 接受存活

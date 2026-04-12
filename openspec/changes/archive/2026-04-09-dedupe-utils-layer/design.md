## Context

`src/utils/tauriCompat/` 提供了 Tauri/Web 双环境的兼容层，包含 keyring（密钥存储）、store（键值存储）、http（网络请求）等模块。其中 `keyring.ts`（504 行）和 `keyringMigration.ts`（514 行）是最复杂的两个文件，它们各自独立实现了 IndexedDB 初始化、AES-256-GCM 加解密、PBKDF2 密钥派生等相同逻辑。`store.ts` 也有一份稍有差异的 `initIndexedDB` 实现。

当前重复代码约 92 行，涉及 7 个代码段，其中 6 个完全相同。

## Goals / Non-Goals

**Goals:**

- 消除 tauriCompat 层的代码重复，将共享逻辑抽取为独立模块
- 保持所有公开 API 不变，对上层调用者透明
- 保持现有测试全部通过
- 新增模块有独立的单元测试覆盖

**Non-Goals:**

- 不重构 keyringMigration 的迁移逻辑本身（仅抽取共享函数）
- 不改变加密算法或安全参数（PBKDF2 迭代次数等保持不变）
- 不清理 keyringMigration 模块（那是独立变更的范围）

## Decisions

### 决策 1：新模块的文件组织方式

**选择**：创建 2 个新文件 + 追加现有 `env.ts` + 更新 `index.ts` 导出

```
src/utils/tauriCompat/
├── env.ts              # 现有：isTauri → 追加：isTestEnvironment, getPBKDF2Iterations, PBKDF2 常量
├── indexedDB.ts        # 新增：initIndexedDB（参数化 keyPath）
├── crypto-helpers.ts   # 新增：encrypt, decrypt, PasswordRecord
├── keyring.ts          # 从共享模块导入
├── keyringMigration.ts # 从共享模块导入
├── store.ts            # 从共享模块导入
└── index.ts            # 更新导出
```

**理由**：按职责划分（环境检测 / 数据库 / 加密），每个模块保持单一职责。`env.ts` 已存在且仅含 `isTauri()`，`isTestEnvironment` 同属环境检测职责，直接追加到该文件保持内聚。替代方案是创建一个 `shared.ts` 大杂烩文件，但违反单一职责原则。

**替代方案**：
- 全部放一个 `shared.ts` — 职责混杂，不利于后续维护
- 保持现状，用 `// 共享代码` 注释标记 — 无法解决同步更新问题

### 决策 2：initIndexedDB 参数化

**选择**：`initIndexedDB(dbName, storeName, keyPath)` 接受 keyPath 参数

**理由**：keyring 使用 `['service', 'user']` 作为复合 keyPath，store 使用 `'key'` 作为单一 keyPath。通过参数化统一为一个函数，避免为细微差异维护两份代码。

**替代方案**：
- 创建两个函数 `initKeyringDB` 和 `initStoreDB` — 仍存在结构重复
- 使用默认参数 `keyPath = 'key'` — 可以，但显式传参更清晰

### 决策 3：crypto-helpers 的导出策略

**选择**：具名导出（named export），不使用类

**理由**：`encrypt`、`decrypt` 是纯函数，无状态，适合直接导出。不需要额外的类包装。`PasswordRecord` 作为 interface 一并导出。

### 决策 4：env.ts 的定位

**选择**：追加到现有 `env.ts`（当前仅含 `isTauri`），同时包含环境检测和 PBKDF2 相关常量/函数

**理由**：`isTestEnvironment` 和 `isTauri` 同属"运行环境检测"职责，且 `isTestEnvironment` 和 `getPBKDF2Iterations` 是强关联的——后者依赖前者来决定迭代次数。将它们放在同一个文件中保持内聚。PBKDF2 常量（`PBKDF2_ALGORITHM`、`DERIVED_KEY_LENGTH`）也与此相关。

## Risks / Trade-offs

**[风险] 循环依赖** → `env.ts` 和 `crypto-helpers.ts` 被同一文件导入时不会产生循环依赖，因为它们之间没有互相引用。`indexedDB.ts` 也独立于其他两个模块。

**[风险] 重构遗漏导致行为不一致** → 每个抽取步骤后运行完整测试套件验证。关键路径：keyring 初始化 → 加密存储 → 聊天发送。

**[风险] keyringMigration 中加密函数的历史兼容性** → 迁移代码使用的加密实现与 keyring 完全相同（已确认 100% 一致），抽取后行为不变。

**[权衡] 新增 2 个文件 + 追加 1 个文件 vs 减少重复** → 新增约 80 行模块代码（含类型和导出），但消除约 92 行重复，净效果接近零。真正收益在于维护点从 N 个变为 1 个。

**[风险] Mock 文件同步** → `src/utils/tauriCompat/__mocks__/` 目录下的 mock 文件可能直接引用了被重构函数的原始路径。抽取为共享模块后，需检查并更新 mock 文件以确保模块解析正确。

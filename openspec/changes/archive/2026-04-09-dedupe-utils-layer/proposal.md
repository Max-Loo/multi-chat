## Why

`src/utils/tauriCompat/` 目录下存在约 92 行完全重复的代码，分布在 `keyring.ts`、`keyringMigration.ts`、`store.ts` 三个文件中。重复内容包括 IndexedDB 初始化、加密/解密函数、测试环境检测、PBKDF2 常量等。这些重复增加了维护成本——修改加密逻辑或 IndexedDB 初始化需要同步更新多处，且容易遗漏导致行为不一致。

## What Changes

- 将 `initIndexedDB` 从三处实现抽取为 `src/utils/tauriCompat/indexedDB.ts` 公共模块，通过参数化 keyPath 消除差异
- 将 `encrypt` / `decrypt` / `PasswordRecord` 从 `keyring.ts` 和 `keyringMigration.ts` 抽取到 `src/utils/tauriCompat/crypto-helpers.ts`
- 将 `isTestEnvironment` / `getPBKDF2Iterations` / PBKDF2 常量追加到已有的 `src/utils/tauriCompat/env.ts`（该文件当前仅包含 `isTauri` 函数）
- `keyring.ts` 和 `keyringMigration.ts` 改为从新模块导入，删除本地重复实现
- `store.ts` 改为从 `indexedDB.ts` 导入 `initIndexedDB`

## Capabilities

### New Capabilities

- `tauri-compat-shared-modules`: tauriCompat 层的共享工具模块（IndexedDB 初始化、加密辅助函数、环境检测），供 keyring、keyringMigration、store 共同使用

### Modified Capabilities

- `web-keyring-compat`: 内部实现改为从共享模块导入，公开 API 不变
- `keyring-migration`: 内部实现改为从共享模块导入，迁移行为不变
- `web-store-compat`: 内部实现改为从共享模块导入，公开 API 不变

## Impact

- **代码文件**：新增 2 个文件（`indexedDB.ts`、`crypto-helpers.ts`），追加 1 个文件（`env.ts`），修改 3 个文件（`keyring.ts`、`keyringMigration.ts`、`store.ts`），修改 `index.ts` 导出
- **Mock 文件**：需检查并同步更新 `src/utils/tauriCompat/__mocks__/` 目录下的相关 mock 文件
- **API 兼容性**：无破坏性变更，所有公开 API 保持不变
- **依赖**：无新增外部依赖
- **测试**：现有测试应继续通过，无需修改测试逻辑；新增模块可考虑添加单元测试

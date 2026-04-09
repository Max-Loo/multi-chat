## 1. 创建共享模块

- [x] 1.1 追加到 `src/utils/tauriCompat/env.ts`：在现有 `isTauri` 函数基础上，新增 `isTestEnvironment`、`getPBKDF2Iterations`、`PBKDF2_ALGORITHM`、`DERIVED_KEY_LENGTH` 为具名导出
- [x] 1.2 创建 `src/utils/tauriCompat/indexedDB.ts`：抽取 `initIndexedDB(dbName, storeName, keyPath)` 为具名导出，keyPath 参数化支持复合键和单一键
- [x] 1.3 创建 `src/utils/tauriCompat/crypto-helpers.ts`：抽取 `encrypt`、`decrypt` 函数和 `PasswordRecord` 接口为具名导出

## 2. 重构现有模块

- [x] 2.1 重构 `keyring.ts`：删除本地的 `isTestEnvironment`、`getPBKDF2Iterations`、PBKDF2 常量、`initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`，改为从共享模块导入
- [x] 2.2 重构 `keyringMigration.ts`：删除本地的 `isTestEnvironment`、`getPBKDF2Iterations`、PBKDF2 常量、`initIndexedDB`、`encrypt`、`decrypt`、`PasswordRecord`，改为从共享模块导入
- [x] 2.3 重构 `store.ts`：删除本地的 `initIndexedDB`，改为从共享模块导入

## 3. 更新导出

- [x] 3.1 更新 `src/utils/tauriCompat/index.ts`：确保新模块的导出对上层可见（如有必要）

## 4. 验证

- [x] 4.1 运行 `pnpm test:all` 确认所有现有测试通过
- [x] 4.2 运行 `pnpm tsc` 确认类型检查通过
- [x] 4.3 运行 `pnpm lint` 确认无 lint 错误
- [x] 4.4 检查并更新 `src/utils/tauriCompat/__mocks__/` 目录下的相关 mock 文件，确保模块路径引用正确

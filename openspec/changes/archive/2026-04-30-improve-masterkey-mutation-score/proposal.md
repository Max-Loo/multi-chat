## Why

`store/keyring/masterKey.ts`（275 行 / 14 条件分支 / 7 条错误处理路径）是应用安全核心模块，负责主密钥的生成、存储、获取、导入导出全生命周期管理。密钥管理的任何逻辑回归都可能导致用户加密数据永久不可恢复。该模块不在当前变异测试覆盖范围内（`stryker.config.json` 未配置），且 14 个条件分支中包含 `isTauri()` 环境分支，Tauri/Web 双路径的错误处理差异容易被现有测试遗漏。

## What Changes

- 将 `src/store/keyring/masterKey.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- 精确化 `getMasterKey` / `storeMasterKey` 中 Tauri 环境分支的错误消息断言（当前仅使用 `toThrow()`，需改为精确消息匹配；Web 环境已有精确断言）
- 补充 `importMasterKey` 中 `InvalidKeyFormatError` 的 `instanceof` 和 `name` 属性断言
- 补充 `getMasterKey` / `storeMasterKey` 错误路径中 `cause` 属性的断言（防止 ObjectLiteral 变异存活）

## Capabilities

### New Capabilities

- `masterkey-mutation-coverage`: masterKey.ts 变异测试覆盖率提升，精确化 Tauri 环境错误消息断言、补充 InvalidKeyFormatError 类型验证和错误 cause 属性断言

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/store/keyring/masterKey.test.ts` — 新增约 5-8 个测试用例，精确化 2 个现有断言
- **配置文件**: `stryker.config.json` — `mutate` 列表新增 1 个文件
- **构建时间**: 变异测试运行时间预计增加 1-2 分钟（预估 100-150 变异体）
- **CI/CD**: 无影响，变异测试不在 CI 流水线中运行

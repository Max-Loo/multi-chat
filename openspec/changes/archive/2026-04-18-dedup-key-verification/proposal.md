## Why

`keyVerification.ts` 完整复制了 `modelStorage.ts` 中的 LazyStore 单例管理模式（模块级变量 + get 函数 + reset 函数），两者都操作 `'models.json'` 文件。加密模型检测谓词 `(model) => model.apiKey && typeof model.apiKey === 'string' && isEncrypted(model.apiKey)` 也在两处重复。此外 `modelStorage.ts` 内部未使用已导入的 `isEncrypted()` 工具函数，而是直接调用 `startsWith("enc:")`，与 `keyVerification.ts` 的写法不一致。

## What Changes

- 提取 `isModelEncrypted(model: Model): boolean` 工具函数，统一加密模型检测逻辑
- 让 `keyVerification.ts` 复用 `modelStorage.ts` 的 `getModelsStore()` 进行只读操作，移除重复的 store 单例
- 将 `modelStorage.ts` 中的 `startsWith("enc:")` 替换为 `isEncrypted()` 调用

## Capabilities

### New Capabilities
- `model-encryption-predicate`: 统一的模型加密检测工具函数

### Modified Capabilities
<!-- 无既有 spec 的行为变更 -->

## Impact

- **工具函数**：`src/utils/crypto.ts` 或新文件 — 新增 `isModelEncrypted` 函数
- **密钥验证**：`src/store/keyring/keyVerification.ts` — 移除重复 store 单例，复用 `getModelsStore()`
- **模型存储**：`src/store/storage/modelStorage.ts` — `startsWith("enc:")` 改为 `isEncrypted()`，导出必要的内部函数
- **无运行时行为变更**，仅代码结构优化

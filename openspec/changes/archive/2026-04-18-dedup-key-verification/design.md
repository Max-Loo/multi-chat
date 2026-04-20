## Context

`keyVerification.ts` 和 `modelStorage.ts` 各自维护了一个操作 `'models.json'` 的 LazyStore 单例。`verifyMasterKey` 仅执行只读操作（加载模型列表并检测加密状态），而 `modelStorage.ts` 已有完整的 store 管理和模型读写功能。两文件中的加密检测谓词也高度相似。

## Goals / Non-Goals

**Goals:**
- 消除 `keyVerification.ts` 和 `modelStorage.ts` 之间的 store 单例重复
- 统一加密模型检测逻辑为单一工具函数
- 统一 `isEncrypted()` 的使用方式，消除 `startsWith("enc:")` 的不一致

**Non-Goals:**
- 不重构 `modelStorage.ts` 的整体架构
- 不改变 `verifyMasterKey` 的功能签名或返回值
- 不处理其他文件中可能的类似重复

## Decisions

### 1. `isModelEncrypted` 放置位置

**选择**：在 `src/store/storage/modelStorage.ts` 中定义并导出 `isModelEncrypted`

**替代方案**：放在 `src/utils/crypto.ts` 中

**理由**：该谓词涉及 `Model` 类型（来自业务层），不是纯加密操作。`modelStorage.ts` 已同时引用 `Model` 类型和 `isEncrypted()` 函数，是自然的归属位置。

### 2. 复用 store 的方式

**选择**：导出 `getModelsStore()` 和 `resetModelsStore()`，让 `keyVerification.ts` 直接导入使用

**替代方案**：创建共享的 store 工厂函数

**理由**：`verifyMasterKey` 仅执行只读操作，不需要独立的 store 实例。复用现有 `getModelsStore()` 最简单且无副作用风险。`keyVerification.ts` 中的 `resetVerificationStore()` 可改为调用 `resetModelsStore()`。

### 3. `startsWith("enc:")` 替换

**选择**：统一使用已导入的 `isEncrypted()` 函数

**理由**：`modelStorage.ts` 已在第 6 行导入 `isEncrypted`，但未在所有位置使用。统一后语义更清晰。

## Risks / Trade-offs

- **两个模块共享 store 实例** → `verifyMasterKey` 的只读操作与 `modelStorage` 的写操作共享同一 store。由于 `verifyMasterKey` 仅读取数据，不存在竞争风险。
- **`resetModelsStore` 影响范围扩大** → 测试中调用 `resetVerificationStore()` 的地方需改为 `resetModelsStore()`，需同步更新测试。

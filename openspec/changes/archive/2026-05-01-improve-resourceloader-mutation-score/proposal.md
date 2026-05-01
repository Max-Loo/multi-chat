## Why

`utils/resourceLoader.ts`（381 行 / 15 条件分支 / 5 条错误处理路径）是按需加载机制的核心，实现 `ResourceLoader<T>` 泛型类，包含 LRU 缓存淘汰、并发加载控制、带重试的加载策略、预加载标记等逻辑。25 个条件表达式中 LRU 淘汰条件和 `isNetworkError` 多层 fallback 检测策略是变异测试的高价值目标。一个 LRU 淘汰逻辑的回归可能导致缓存行为异常，影响应用启动性能。

## What Changes

- 将 `src/utils/resourceLoader.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- 补充 `isNetworkError` 所有 fallback 路径的测试：TypeError 实例、error.code 白名单（ERR_NETWORK/ECONNREFUSED/ETIMEDOUT/ENOTFOUND/ECONNRESET/EAI_AGAIN）、ChunkLoadError 字符串匹配、message 关键词匹配（fetch/network/timeout/connection/econnrefused/etimedout/enotfound）
- 补充 `loadWithRetry` 重试逻辑的测试：达到 maxRetry 抛出原始错误、不可重试错误立即抛出、自定义 isRetryable 回调覆盖默认行为
- 补充 LRU 缓存淘汰的测试：缓存满时淘汰最久未访问的条目、缓存未满时不淘汰
- 补充 `preload` 失败路径的测试：加载失败标记 preloadFailed、5 秒后延迟清理状态
- 补充 `load` 并发控制的测试：同一资源并发调用共享同一个 Promise
- 补充 `forceReload` / `reset` / `clearAll` 的状态清理测试

## Capabilities

### New Capabilities

- `resourceloader-mutation-coverage`: resourceLoader.ts 变异测试覆盖率提升，包含 LRU 缓存、并发控制、重试策略、预加载标记的全面测试

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/utils/resourceLoader.test.ts` — 新增约 20-25 个测试用例
- **配置文件**: `stryker.config.json` — `mutate` 列表新增 1 个文件
- **构建时间**: 变异测试运行时间预计增加 2-3 分钟（预估 150-200 变异体）
- **CI/CD**: 无影响，变异测试不在 CI 流水线中运行

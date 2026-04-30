## Why

`services/modelRemote/index.ts`（422 行 / 18 条件分支 / 6 条错误处理路径）是远程模型数据获取的核心模块，包含 HTTP 请求、超时控制、指数退避重试、缓存策略等复杂逻辑。重试循环中包含多层嵌套条件（4xx 不重试 vs 5xx 可重试、重试次数判断、错误类型分类），是变异测试最容易发现逻辑漏洞的高价值目标。当前不在变异测试覆盖范围内。

## What Changes

- 将 `src/services/modelRemote/index.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- 补充 `isRetryableError` 所有分支的测试：TypeError 实例检查、error.code 白名单匹配、statusCode >= 500 判断
- 补充 `fetchRemoteData` 重试逻辑的测试：4xx 立即失败不重试、5xx 触发重试、重试耗尽后抛出 lastError、网络错误包装为 NETWORK_ERROR
- 补充 `combineSignals` 的 abort 传播测试
- 补充 `fetchWithTimeout` 超时 vs 正常响应的分支测试
- 补充缓存相关函数的测试：`isRemoteDataFresh` 时间边界、`loadCachedProviderData` 缓存不存在路径
- 审查并精确化错误断言，确保验证 errorType 而非仅验证 message

## Capabilities

### New Capabilities

- `modelremote-mutation-coverage`: modelRemote/index.ts 变异测试覆盖率提升，包含重试逻辑、错误分类、超时控制、缓存策略的全面测试

### Modified Capabilities

（无）

## Impact

- **测试文件**: `src/__test__/services/modelRemoteService.test.ts` — 新增约 20-25 个测试用例
- **配置文件**: `stryker.config.json` — `mutate` 列表新增 1 个文件
- **构建时间**: 变异测试运行时间预计增加 2-3 分钟（预估 150-200 变异体）
- **CI/CD**: 无影响，变异测试不在 CI 流水线中运行

## Why

modelRemote/index.ts 变异测试得分 80.41%，19 个存活变异体集中在两个条件判断上。其中 `response.status >= 400 && response.status < 500` 一行条件就贡献了 12 个存活变异——所有边界变体（`>=`/`>`、`<`/`<=`、`&&`/`||`、true/false）都未被检测到。这说明测试验证了"4xx 不重试"的结果，但没有验证导致不重试的原因是错误类型和状态码的精确组合。

## What Changes

- 4xx 错误检测条件（约 12 个存活）：补充边界值测试（status 400/499/500），验证抛出的 RemoteDataError 类型和 statusCode
- isRetryableError 条件链（约 4 个存活）：测试 SERVER_ERROR 无 statusCode 的场景
- 重试延迟计算（1 个存活）：验证指数退避的实际延迟值
- retryCount 边界（1 个存活）：验证 retryCount 达到 maxRetries 时停止重试

## Capabilities

### New Capabilities

- `modelremote-mutation-phase2`: modelRemote/index.ts 第二轮变异测试提升，目标从 80.41% → ≥95%

### Modified Capabilities

（无）

## Constraints

- 变异测试验证时使用针对具体文件的增量命令（如 `pnpm test:mutation --mutate "src/services/modelRemote/index.ts"`），不运行全量变异测试

## Impact

- **测试文件**: `src/__test__/services/modelRemoteService.test.ts` — 新增约 8-10 个测试用例
- **源代码**: 无改动
- **构建时间**: 变异测试运行时间预计增加约 30 秒
- **CI/CD**: 无影响

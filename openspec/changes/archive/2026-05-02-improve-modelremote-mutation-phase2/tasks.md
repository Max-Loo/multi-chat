## Tasks

- [x] ### Task 1: 4xx 错误检测条件边界测试（杀 12 个变异体）

  - **文件**: `src/__test__/services/modelRemoteService.test.ts`
  - **目标**: `response.status >= 400 && response.status < 500` 条件的 12 个存活变异（`>=`/`>`、`<`/`<=`、`&&`/`||`、true/false、block 清空）
  - **操作**: 新增 `describe('fetchRemoteData - 4xx 边界值精确验证')`
    - 测试 1: status=400 时验证抛出 RemoteDataError，且 `error.type === SERVER_ERROR`、`error.statusCode === 400`
    - 测试 2: status=499 时验证同样抛出错误且 `statusCode === 499`
    - 测试 3: status=399（< 400）时验证不走 4xx 分支
    - 测试 4: status=500（≥ 500）时验证走 5xx 重试逻辑而非 4xx 立即失败
    - 测试 5: status=404 时验证 `isRetryableError` 返回 false 且重试次数为 0
  - **验证**: 4xx 条件相关 12 个变异体从 Survived → Killed

- [x] ### Task 2: isRetryableError 条件链和重试参数（杀 5 个变异体）

  - **文件**: `src/__test__/services/modelRemoteService.test.ts`
  - **目标**: isRetryableError 条件（4 个）、重试延迟计算（1 个）、sleep 函数体（1 个）、retryCount 边界（1 个）
  - **操作**:
    - 测试 1: 构造 `SERVER_ERROR` 类型但 `statusCode` 为 undefined 的错误，验证不重试
    - 测试 2: 构造 `SERVER_ERROR` 类型且 `statusCode >= 500` 的错误，验证可重试
    - 测试 3: 使用 `vi.useFakeTimers` 验证重试延迟为指数退避（base * 2^retryCount）
    - 测试 4: retryCount 等于 maxRetries 时验证不再重试
  - **验证**: isRetryableError 和重试逻辑相关 5-6 个变异体从 Survived → Killed

- [x] ### Task 3: 运行变异测试验证

  - **操作**: `pnpm test:mutation`
  - **验证**: modelRemote/index.ts 变异得分 ≥ 95%

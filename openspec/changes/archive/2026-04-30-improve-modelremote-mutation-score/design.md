## Context

`services/modelRemote/index.ts`（422 行）是远程模型数据获取模块，包含 4 个导出函数 + 6 个私有函数、18 个条件分支、6 条错误处理路径。核心函数 `fetchRemoteData` 实现了 HTTP 请求 + 超时控制 + 指数退避重试 + AbortSignal 取消。已有 17 个测试用例（modelRemoteService.test.ts），覆盖了主要路径但部分边界条件未覆盖。

## Goals / Non-Goals

**Goals:**
- 将 modelRemote/index.ts 加入变异测试覆盖，得分目标 ≥ 80%
- 杀死 `isRetryableError` 所有分支的变异体（TypeError/NeworkTimeout/NetworkError/5xx 四条路径）
- 杀死 `fetchRemoteData` 重试逻辑的变异体（4xx 不重试、5xx 可重试、重试耗尽、非 RemoteDataError 包装）
- 补充 `combineSignals` abort 传播边界测试
- 补充 `fetchWithTimeout` 超时 vs 正常响应的精确断言

**Non-Goals:**
- 不修改源码
- 不改变缓存策略或重试参数
- 不涉及 config.ts（仅配置常量）

## Decisions

**1. 私有函数通过间接测试覆盖**
- 理由：`combineSignals`、`fetchWithTimeout`、`isRetryableError` 等私有函数已通过 `fetchRemoteData` 间接测试。变异测试中这些函数的变异体会被对应集成测试杀死
- 替代方案：使用 `@ts-expect-error` 或 `(module as any).privateFunc` 直接测试 → 增加 brittle 测试代码

**2. 重点攻击 `isRetryableError` 四路分支**
- 理由：该函数有 4 个 return 路径（NETWORK_TIMEOUT → true、NETWORK_ERROR → true、SERVER_ERROR + statusCode >= 500 → true、其他 → false），每个分支的 ConditionalExpression 变异都需要专门测试
- 策略：在「错误分类」describe 块中补充 5xx 可重试、4xx 不重试的精确断言

**3. 重点攻击 `fetchRemoteData` 重试循环**
- 理由：L360-410 的重试循环是条件最密集的区域，包含 `!response.ok`、`status >= 400 && < 500`、`retryCount < maxRetries`、`isRetryableError` 四个嵌套条件
- 策略：补充 5xx 重试间隔验证（指数退避）、非 RemoteDataError 包装为 NETWORK_ERROR 的断言

**4. 精确化错误断言**
- 理由：现有测试仅 `expect(error.type).toBe(RemoteDataErrorType.X)`，但 ObjectLiteral 变异可能修改 Error 构造参数
- 策略：补充 `error.message` 和 `error.cause` 的断言

**5. 预估变异体数量约 150-200 个**

## Risks / Trade-offs

- **[fetch mock 复杂度]** 测试需要精确控制 mock fetch 的响应时间、状态码、错误类型 → 复用现有 mock 策略
- **[重试延迟导致测试变慢]** 指数退避重试可能增加测试时间 → 使用 `vi.useFakeTimers()` 控制时间
- **[AbortSignal 行为差异]** Node.js 和浏览器环境对 AbortSignal 的支持不同 → 测试环境已通过 mock 统一

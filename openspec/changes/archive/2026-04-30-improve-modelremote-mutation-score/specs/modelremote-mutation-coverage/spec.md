## ADDED Requirements

### Requirement: isRetryableError 四路分支覆盖
测试 SHALL 验证 `isRetryableError` 函数的四个返回路径。

#### Scenario: NETWORK_TIMEOUT 错误可重试
- **WHEN** 错误类型为 `RemoteDataErrorType.NETWORK_TIMEOUT`
- **THEN** `isRetryableError` 返回 `true`

#### Scenario: NETWORK_ERROR 错误可重试
- **WHEN** 错误类型为 `RemoteDataErrorType.NETWORK_ERROR`
- **THEN** `isRetryableError` 返回 `true`

#### Scenario: SERVER_ERROR 且 statusCode >= 500 可重试
- **WHEN** 错误类型为 `RemoteDataErrorType.SERVER_ERROR` 且 statusCode >= 500
- **THEN** `isRetryableError` 返回 `true`

#### Scenario: SERVER_ERROR 且 statusCode < 500 不可重试
- **WHEN** 错误类型为 `RemoteDataErrorType.SERVER_ERROR` 且 statusCode < 500
- **THEN** `isRetryableError` 返回 `false`

#### Scenario: 其他错误类型不可重试
- **WHEN** 错误类型不属于以上三类
- **THEN** `isRetryableError` 返回 `false`

### Requirement: fetchRemoteData 重试逻辑覆盖
测试 SHALL 验证重试循环中的关键条件分支。

#### Scenario: 4xx 错误立即失败不重试
- **WHEN** 服务器返回 404 状态码
- **THEN** 立即抛出 `RemoteDataError(SERVER_ERROR)`，重试次数为 0

#### Scenario: 5xx 错误触发重试
- **WHEN** 服务器返回 503 状态码
- **THEN** 触发重试，最终成功后返回数据

#### Scenario: 重试耗尽后抛出 lastError
- **WHEN** 连续 3 次 5xx 错误（maxRetries = 3）
- **THEN** 抛出最后一次的 `RemoteDataError`

#### Scenario: 非 RemoteDataError 包装为 NETWORK_ERROR
- **WHEN** fetch 抛出 TypeError（非 RemoteDataError）
- **THEN** 被包装为 `RemoteDataError(NETWORK_ERROR)` 后走重试逻辑

### Requirement: combineSignals abort 传播
测试 SHALL 验证 AbortSignal 组合后的中止传播行为。

#### Scenario: 已中止的信号立即中止组合信号
- **WHEN** 传入一个已 aborted 的 signal
- **THEN** 组合信号立即中止

### Requirement: fetchWithTimeout 超时与正常响应
测试 SHALL 验证超时和正常响应的精确行为。

#### Scenario: 请求在超时前完成
- **WHEN** 请求耗时小于超时时间
- **THEN** 返回正常响应，不抛出超时错误

#### Scenario: 请求超时
- **WHEN** 请求耗时超过超时时间
- **THEN** 抛出 `RemoteDataError(NETWORK_ERROR)` 且 message 包含超时信息

### Requirement: 缓存相关函数覆盖
测试 SHALL 验证缓存存取和新鲜度判断的边界条件。

#### Scenario: isRemoteDataFresh 边界值
- **WHEN** 缓存时间恰好等于有效期边界
- **THEN** SHALL 明确返回 `true` 或 `false`（验证边界行为）

#### Scenario: loadCachedProviderData 缓存不存在
- **WHEN** Store 返回 null 或 undefined
- **THEN** 抛出 `RemoteDataError(NO_CACHE)`

### Requirement: 精确化错误断言
所有错误断言 SHALL 验证 `error.type`、`error.message` 和 `error.cause`（如有），禁止仅验证 `toThrow()`。

#### Scenario: 错误对象完整验证
- **WHEN** 验证 RemoteDataError
- **THEN** SHALL 同时断言 `error.type` 和 `error.message`

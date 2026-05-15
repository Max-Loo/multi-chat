## 1. 配置 Stryker

- [x] 1.1 将 `src/services/modelRemote/index.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- [x] 1.2 运行 `pnpm test:mutation` 获取基线得分

## 2. 补充 isRetryableError 四路分支测试

- [x] 2.1 补充 NETWORK_TIMEOUT 返回 true 的测试
- [x] 2.2 补充 NETWORK_ERROR 返回 true 的测试
- [x] 2.3 补充 SERVER_ERROR + statusCode >= 500 返回 true 的测试
- [x] 2.4 补充 SERVER_ERROR + statusCode < 500 返回 false 的测试
- [x] 2.5 补充其他错误类型返回 false 的测试

## 3. 补充 fetchRemoteData 重试逻辑测试

- [x] 3.1 补充 4xx 立即失败不重试的测试：验证重试次数为 0
- [x] 3.2 补充 5xx 触发重试的测试：验证重试次数 > 0
- [x] 3.3 补充重试耗尽后抛出 lastError 的测试：验证最后一次错误被抛出
- [x] 3.4 补充非 RemoteDataError 包装为 NETWORK_ERROR 的测试：验证 error.type
- [x] 3.5 精确化已有重试测试的错误断言：补充 error.message 验证

## 4. 补充 combineSignals abort 传播测试

- [x] 4.1 补充已中止信号立即中止组合信号的测试
- [x] 4.2 精确化超时信号触发中止的测试：验证 AbortController.abort 被调用

## 5. 补充 fetchWithTimeout 分支测试

- [x] 5.1 补充请求在超时前完成的测试：验证返回正常响应
- [x] 5.2 精确化超时测试：验证 error.type 为 NETWORK_TIMEOUT

## 6. 补充缓存函数边界测试

- [x] 6.1 补充 `isRemoteDataFresh` 边界值测试：缓存时间恰好等于有效期
- [x] 6.2 精确化 `loadCachedProviderData` 缓存不存在测试：验证 error.type 为 NO_CACHE
- [x] 6.3 补充 `adaptApiResponseToInternalFormat` 白名单过滤的精确断言

## 7. 精确化现有断言

- [x] 7.1 审查所有错误断言，补充 error.type 和 error.message 双重验证
- [x] 7.2 审查所有 `toThrow()` 断言，改为 `try/catch` + 精确字段验证

## 8. 运行变异测试验证

- [x] 8.1 运行 `pnpm test:mutation`
- [x] 8.2 验证 modelRemote/index.ts 变异得分 ≥ 80%（实际得分：80.41%）
- [x] 8.3 如未达标，根据报告分析剩余存活变异并补充测试（已达标，无需额外补充）

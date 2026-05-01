## 1. 配置 Stryker

- [x] 1.1 将 `src/utils/resourceLoader.ts` 加入 `stryker.config.json` 的 `mutate` 列表
- [x] 1.2 运行 `pnpm test:mutation` 获取基线得分

## 2. 补充 isNetworkError 四层 fallback 测试

- [x] 2.1 创建 ResourceLoader 测试子类以暴露 protected `isNetworkError` 方法
- [x] 2.2 **[新增]** L1 测试：TypeError 实例返回 true
- [x] 2.3 **[新增]** L2 测试：error.code 匹配白名单（ERR_NETWORK、ECONNREFUSED、ETIMEDOUT、ENOTFOUND、ECONNRESET、EAI_AGAIN）返回 true
- [x] 2.4 **[新增]** L2 测试：error.code 不匹配已知码（如 ENOENT、RANDOM_ERROR）返回 false
- [x] 2.5 **[新增]** L3 测试：ChunkLoadError 返回 true（使用 `new Error(); err.name = 'ChunkLoadError'`，确保无 code 属性以穿透 L2）
- [x] 2.6 **[新增]** L4 测试：message 包含关键词（fetch/network/timeout/connection/econnrefused/etimedout/enotfound）返回 true（使用普通 Error，无 code 属性，name 非 ChunkLoadError）
- [x] 2.7 **[新增]** 非网络错误返回 false

## 3. 补充 LRU 淘汰条件测试

- [x] 3.1 **[增强已有 test L277-305]** 精确化缓存满时淘汰最久未访问 key 的断言：验证 `get(evictedKey)` 返回 `undefined`
- [x] 3.2 **[新增]** 缓存满但 key 已存在时不触发淘汰
- [x] 3.3 **[增强已有 test L335-371]** 淘汰时清理 loadingPromises 和 states 的精确验证

## 4. 补充 loadWithRetry 重试逻辑测试

- [x] 4.1 **[增强已有 test L104-120]** 达到 maxRetry 抛出原始错误：验证抛出的 error 对象是同一个引用
- [x] 4.2 **[已有 test L145-163 覆盖]** 验证已有非网络错误测试的断言精确性
- [x] 4.3 **[新增]** 自定义 isRetryable 回调覆盖默认行为

## 5. 补充并发加载去重测试

- [x] 5.1 **[已有 test L72-101 覆盖]** 验证已有并发测试的 loader 函数仅执行一次断言
- [x] 5.2 **[新增]** 验证两个调用者得到同一个 Promise 引用（使用 `toBe` 而非结果相等）

## 6. 补充 preload 失败标记测试

- [x] 6.1 **[已有 test L470-494 覆盖]** 验证已有 preloadFailed 标记断言精确性
- [x] 6.2 **[已有 test L471-494 覆盖]** 验证已有 5 秒延迟清理断言精确性
- [x] 6.3 **[已有 test L496-528 覆盖]** 验证已有用户主动加载重试断言精确性

## 7. 精确化状态断言

- [x] 7.1 **[增强]** 将 test L238-239 的逐字段 `toBe` 改为 `toEqual({ status: 'loading', retryCount: 1 })`，捕获多余字段变异
- [x] 7.2 **[增强]** 将 test L256-258 的逐字段 `toBe` 改为 `toEqual({ status: 'loaded', loadTime: expect.any(Number) })`
- [x] 7.3 **[增强]** 将 test L272-273 的逐字段 `toBe` 改为 `toEqual({ status: 'error', error: ... })`

## 8. 运行变异测试验证

- [x] 8.1 运行 `pnpm test:mutation`
- [x] 8.2 验证 resourceLoader.ts 变异得分 ≥ 80%（实际: 97.83%）
- [x] 8.3 如未达标，根据报告分析剩余存活变异并补充测试（从 77.17% 基线提升至 97.83%）

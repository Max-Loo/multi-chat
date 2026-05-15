## ADDED Requirements

### Requirement: isNetworkError 四层 fallback 覆盖
测试 SHALL 验证 `isNetworkError` 方法的四个检测层级，每层都需要独立触发。

#### Scenario: TypeError 实例判定为网络错误
- **WHEN** 错误为 `new TypeError('Failed to fetch')`
- **THEN** `isNetworkError` 返回 `true`

#### Scenario: error.code 匹配网络错误码
- **WHEN** 错误的 code 为 'ERR_NETWORK'、'ECONNREFUSED'、'ETIMEDOUT'、'ENOTFOUND'、'ECONNRESET'、'EAI_AGAIN' 之一
- **THEN** `isNetworkError` 返回 `true`

#### Scenario: error.code 不匹配已知码
- **WHEN** 错误的 code 为 'RANDOM_ERROR'
- **THEN** `isNetworkError` 返回 `false`

#### Scenario: ChunkLoadError 判定为网络错误
- **WHEN** 错误的 name 为 'ChunkLoadError'
- **THEN** `isNetworkError` 返回 `true`

#### Scenario: message 包含网络错误关键词
- **WHEN** 错误的 message 包含 'fetch'、'network'、'timeout'、'connection'、'econnrefused'、'etimedout'、'enotfound' 之一（大小写不敏感）
- **THEN** `isNetworkError` 返回 `true`（前提：错误非 TypeError、无 code 属性、name 非 ChunkLoadError）

#### Scenario: 非网络错误判定为不可重试
- **WHEN** 错误为 `new Error('random error')`
- **THEN** `isNetworkError` 返回 `false`

### Requirement: LRU 淘汰条件覆盖
测试 SHALL 验证 LRU 淘汰的双条件逻辑。

#### Scenario: 缓存满且新 key 不在缓存中触发淘汰
- **WHEN** 缓存已满（maxCacheSize = 2）且加载第 3 个新资源
- **THEN** 最久未访问的资源被淘汰，新资源进入缓存

#### Scenario: 缓存满但 key 已存在时不触发淘汰
- **WHEN** 缓存已满且重新加载已有 key 的资源
- **THEN** 无淘汰发生，仅更新 LRU 顺序

#### Scenario: 淘汰时清理关联状态
- **WHEN** 资源被 LRU 淘汰
- **THEN** 该资源的 loadingPromises 和 states 同时被清理

### Requirement: loadWithRetry 重试逻辑覆盖
测试 SHALL 验证重试控制流的精确行为。

#### Scenario: 达到 maxRetry 抛出原始错误
- **WHEN** 连续失败次数超过 maxRetry（默认 3）
- **THEN** 抛出最后一次的原始错误

#### Scenario: 不可重试错误立即抛出
- **WHEN** 错误为非网络错误（`isNetworkError` 返回 false）
- **THEN** 立即抛出，不进入重试循环

#### Scenario: 自定义 isRetryable 回调覆盖默认行为
- **WHEN** 配置了自定义 `isRetryable` 回调
- **THEN** 使用回调结果代替 `this.isNetworkError()`

### Requirement: 并发加载去重覆盖
测试 SHALL 验证同一资源的并发请求共享 Promise。

#### Scenario: 同一资源并发调用共享 Promise
- **WHEN** 两个并发调用同时请求同一资源
- **THEN** 加载器函数仅执行一次，两个调用者得到同一个 Promise

### Requirement: preload 失败标记与延迟清理
测试 SHALL 验证预加载失败后的状态管理。

#### Scenario: 预加载失败标记 preloadFailed
- **WHEN** 某个资源预加载失败
- **THEN** 该资源的状态中 `preloadFailed` 为 `true`

#### Scenario: 5 秒后延迟清理 preloadFailed 标记
- **WHEN** 预加载失败且经过 5 秒
- **THEN** `preloadFailed` 标记被清除

### Requirement: 精确化状态断言
所有 `getState()` 返回值的断言 SHALL 使用 `toEqual` 逐字段验证，禁止使用 `toMatchObject`。

#### Scenario: 加载中状态精确验证
- **WHEN** 资源正在加载
- **THEN** `getState(key)` 返回 `{ status: 'loading', retryCount: <number> }`

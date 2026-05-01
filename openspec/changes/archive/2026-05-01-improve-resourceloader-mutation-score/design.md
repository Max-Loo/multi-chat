## Context

`utils/resourceLoader.ts`（381 行）是 `ResourceLoader<T>` 泛型类，实现按需加载机制，包含 15 个方法、15 个条件分支、5 条错误处理路径。核心功能包括 LRU 缓存淘汰（maxCacheSize）、并发加载去重（loadingPromises）、带重试的加载策略（loadWithRetry）、预加载标记（preloadFailed）。已有 22 个测试用例（resourceLoader.test.ts），覆盖了主要路径。

## Goals / Non-Goals

**Goals:**
- 将 resourceLoader.ts 加入变异测试覆盖，得分目标 ≥ 80%
- 杀死 `isNetworkError` 多层 fallback 的变异体（TypeError → error.code → ChunkLoadError → message 匹配）
- 杀死 LRU 淘汰条件的变异体（cache.size >= maxCacheSize && !cache.has(key)）
- 杀死 `loadWithRetry` 重试逻辑的变异体（attempt > maxRetry、isRetryable 判断）
- 精确化 `getState` 返回值的断言

**Non-Goals:**
- 不修改源码
- 不改变 LRU 策略或重试参数
- 不增加新的公开方法

## Decisions

**1. 创建 ResourceLoader 子类测试 `isNetworkError`**
- 理由：`isNetworkError` 是 protected 方法，无法直接从外部调用。通过创建测试子类暴露该方法
- 替代方案：使用 `(loader as any).isNetworkError()` → 可行但不够类型安全

**2. 重点攻击 `isNetworkError` 四层 fallback**
- 理由：L207-243 有 4 个串行的条件检查，每个都是独立的 ConditionalExpression 变异目标。需要构造 4 种不同类型的错误对象分别测试
- 策略：四个独立用例，每个用例必须仅穿透到目标层级：
  - L1（TypeError）：`new TypeError('Failed to fetch')` → 在 instanceof 检查处直接返回 true
  - L2（error.code）：`new Error('test'); err.code = 'ECONNRESET'` → 必须是非 TypeError 且有 code 属性，验证白名单匹配
  - L3（ChunkLoadError）：`new Error('test'); err.name = 'ChunkLoadError'` → 必须是非 TypeError、无 code 属性、name 为 ChunkLoadError
  - L4（message 匹配）：`new Error('Network connection failed')` → 必须是非 TypeError、无 code 属性、name 非 ChunkLoadError 的普通 Error，message 包含关键词（fetch/network/timeout/connection/econnrefused/etimedout/enotfound）

**3. 重点攻击 LRU 淘汰的双条件**
- 理由：L261 的 `cache.size >= maxCacheSize && !cache.has(key)` 是 AND 条件，变异测试可能将其某个子条件反转为 true/false
- 策略：精确验证淘汰的是最久未访问的 key（而非随机 key），验证已有 key 更新时不触发淘汰

**4. 预估变异体数量约 150-200 个**

## Risks / Trade-offs

- **[setTimeout 导致测试变慢]** `preload` 中有 5 秒延迟清理 → 使用 `vi.useFakeTimers()` 控制
- **[私有方法覆盖]** `loadWithRetry`、`setCache`、`updateLRU` 为私有方法 → 通过公开方法间接触发
- **[泛型类型无关]** 变异测试不关心泛型类型参数 → 测试中统一使用简单类型（如 string）

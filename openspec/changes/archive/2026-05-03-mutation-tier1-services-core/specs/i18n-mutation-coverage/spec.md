## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 loadLanguage 缓存一致性
测试套件 SHALL 杀死 `loadLanguage` 中 `loadedLanguages.has(lang)` 和 `loadingPromises.has(lang)` 的条件变异体，确保缓存命中时直接返回、竞态时复用 Promise。

#### Scenario: 已加载语言的缓存命中
- **WHEN** 对已加载的语言（如 "en"）调用 `loadLanguage`
- **THEN** SHALL 不触发 `performLoad`，直接返回已缓存结果

#### Scenario: 正在加载中的语言复用 Promise
- **WHEN** 同一语言同时被多次请求加载
- **THEN** SHALL 返回同一个 Promise 实例（引用相等），不创建重复加载请求

### Requirement: 变异测试 SHALL 验证 performLoad 指数退避重试
测试套件 SHALL 杀死 `performLoad` 中 `Math.pow(2, attempt) * 1000` 的算术变异体和 `isNetworkError` 条件变异体。

#### Scenario: 网络错误触发重试
- **WHEN** 加载语言时遇到包含 "fetch" 的错误
- **THEN** SHALL 等待指数退避延迟后重试（第一次 1s，第二次 2s）

#### Scenario: 非网络错误不重试
- **WHEN** 加载语言时遇到非网络错误（如 "Language xxx not found"）
- **THEN** SHALL 立即抛出错误，不进行重试

### Requirement: 变异测试 SHALL 加强 initI18n 单例模式断言
现有测试验证多次调用返回 defined，需补充引用相等断言以杀死 `return` 语句的变异体。

#### Scenario: 多次调用返回同一 Promise 实例
- **WHEN** 连续多次调用 `initI18n`
- **THEN** SHALL 返回相同的 Promise 实例（`toBe` 引用相等，非仅 defined）

### Requirement: 变异测试 SHALL 加强 initI18n 语言降级路径断言
现有测试验证降级后不崩溃，需补充 `lng` 参数断言以杀死 `actualLang` 赋值的变异体。

#### Scenario: 系统语言加载失败时降级到英文
- **WHEN** `getDefaultAppLanguage` 返回非英文语言，但 `loadLanguage` 失败
- **THEN** SHALL `init` 的 `lng` 参数保持为 `'en'`（需断言 `toHaveBeenCalledWith` 的 lng 值）

### Requirement: 变异测试 SHALL 验证 tSafely 多重降级条件
测试套件 SHALL 杀死 `tSafely` 中 `translated === safeKey`、`!translated`、`includes('returned an object')` 的条件变异体。

#### Scenario: 翻译结果等于 key 时使用降级文本
- **WHEN** i18n 已初始化，但翻译结果等于 key 本身
- **THEN** SHALL 返回 fallback 文本

#### Scenario: 翻译结果为空字符串时使用降级文本
- **WHEN** i18n 已初始化，但翻译结果为空字符串
- **THEN** SHALL 返回 fallback 文本

#### Scenario: 翻译结果包含错误标记时使用降级文本
- **WHEN** i18n 已初始化，翻译结果包含 "returned an object instead of string"
- **THEN** SHALL 返回 fallback 文本

### Requirement: 变异测试 SHALL 验证 languageResourcesCache 一致性
测试套件 SHALL 杀死 `languageResourcesCache.set()` 和 `languageResourcesCache.get()` 的调用变异体。

#### Scenario: 加载成功后资源写入缓存
- **WHEN** 非英文语言加载成功
- **THEN** SHALL 将资源写入 `languageResourcesCache`

#### Scenario: 缓存资源被用于后续初始化
- **WHEN** 系统语言已缓存，调用 `initI18n`
- **THEN** SHALL 从缓存读取资源并添加到 `initialResources`

## ADDED Requirements

### Requirement: 变异测试 SHALL 验证 resolveAlias 大小写归一化
测试套件 SHALL 杀死 `lang.toLowerCase()` 的变异体。

#### Scenario: 大写别名正确解析
- **WHEN** 传入 'JS' 作为语言名
- **THEN** SHALL 解析为 'javascript' 并成功加载

#### Scenario: 混合大小写正确解析
- **WHEN** 传入 'Python' 作为语言名
- **THEN** SHALL 解析为 'python' 并成功加载

### Requirement: 变异测试 SHALL 验证 loadLanguageAsync 四路分发
测试套件 SHALL 杀死 `loadedLanguages.has`、`failedLanguages.has`、`loadingPromises.has` 的条件变异体。

#### Scenario: 已加载语言直接返回
- **WHEN** 对已加载的语言调用 loadLanguageAsync
- **THEN** SHALL 立即返回，不调用 loadLanguageModule

#### Scenario: 失败过的语言直接抛出错误
- **WHEN** 对之前加载失败的语言调用 loadLanguageAsync
- **THEN** SHALL 抛出包含 "previously failed" 的错误，不调用 loadLanguageModule

#### Scenario: 正在加载中复用 Promise
- **WHEN** 同一语言正在加载中，再次调用 loadLanguageAsync
- **THEN** SHALL 返回同一个 Promise 实例

#### Scenario: 首次加载创建新 Promise
- **WHEN** 对从未加载过的语言调用 loadLanguageAsync
- **THEN** SHALL 调用 loadLanguageModule 并注册语言

### Requirement: 变异测试 SHALL 验证 failedLanguages 防重试机制
测试套件 SHALL 杀死 `this.failedLanguages.add(resolvedLang)` 和 `this.loadingPromises.delete(resolvedLang)` 的调用变异体。

#### Scenario: 加载失败后记录到 failedLanguages
- **WHEN** loadLanguageModule 抛出错误
- **THEN** SHALL hasFailedToLoad 返回 true，isLoaded 返回 false

#### Scenario: 加载失败后清理 loadingPromises 缓存
- **WHEN** loadLanguageModule 抛出错误
- **THEN** SHALL loadingPromises 中不保留该语言的 Promise

#### Scenario: 失败语言阻止重试
- **WHEN** 对已失败的语言再次调用 loadLanguageAsync
- **THEN** SHALL 不调用 loadLanguageModule（调用次数不变）

### Requirement: 变异测试 SHALL 验证 doLoadLanguage 注册语言
测试套件 SHALL 杀死 `hljs.registerLanguage(lang, module.default)` 的调用变异体。

#### Scenario: 加载成功后注册到 highlight.js
- **WHEN** loadLanguageModule 返回有效模块
- **THEN** SHALL 调用 hljs.registerLanguage 并传入语言名和模块定义

### Requirement: 变异测试 SHALL 验证 highlightSync 未加载守卫
测试套件 SHALL 杀死 `this.loadedLanguages.has(resolvedLang)` 的条件变异体。

#### Scenario: 未加载语言高亮抛出错误
- **WHEN** 对未加载的语言调用 highlightSync
- **THEN** SHALL 抛出包含语言名的错误

#### Scenario: 已加载语言高亮返回结果
- **WHEN** 对已加载的语言调用 highlightSync
- **THEN** SHALL 调用 hljs.highlight 并返回结果

### Requirement: 变异测试 SHALL 验证 isSupportedLanguage 硬编码列表
测试套件 SHALL 杀死 `supportedLanguages.includes(resolvedLang)` 的变异体。

#### Scenario: 支持的语言返回 true
- **WHEN** 检查 'javascript' 是否支持
- **THEN** SHALL 返回 true

#### Scenario: 不支持的语言返回 false
- **WHEN** 检查 'brainfuck' 是否支持
- **THEN** SHALL 返回 false

### Requirement: 变异测试 SHALL 验证单例构造函数守卫
测试套件 SHALL 杀死 `if (HighlightLanguageManager.instance)` 的条件变异体。

#### Scenario: 已有实例时 new 抛出错误
- **WHEN** 单例实例已存在时尝试 `new HighlightLanguageManager()`
- **THEN** SHALL 抛出 "Use getInstance()" 错误

#### Scenario: _resetInstance 允许创建新实例
- **WHEN** 调用 _resetInstance 后再调用 getInstance
- **THEN** SHALL 返回新的实例（引用不同）

### Requirement: 变异测试 SHALL 验证 markAsLoaded 功能
测试套件 SHALL 杀死 `this.loadedLanguages.add(lang)` 的调用变异体。

#### Scenario: markAsLoaded 后 isLoaded 返回 true
- **WHEN** 调用 markAsLoaded('javascript')
- **THEN** SHALL isLoaded('javascript') 返回 true

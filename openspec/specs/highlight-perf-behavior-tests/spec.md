# highlight-perf-behavior-tests

## Purpose

验证 HighlightLanguageManager 和 codeBlockUpdater 在并发、重复、失败等边界场景下的行为正确性，确保性能关键路径（Promise 共享、快速返回、失败短路、精确重试）按预期工作。

## Requirements

### Requirement: HighlightLanguageManager 并发加载时 Promise 共享机制
系统 SHALL 确保对同一语言的多个并发 `loadLanguageAsync` 调用，底层 `doLoadLanguage` 仅执行一次。并发请求 SHALL 共享同一个 Promise。

#### Scenario: 同一语言 3 次并发加载
- **WHEN** 同时发起 3 次 `loadLanguageAsync('javascript')` 调用
- **THEN** `loadingPromises` 中仅有 1 个条目（key 为 'javascript'），3 个调用返回同一 Promise 引用，`loadLanguageModule` mock 仅被调用 1 次，`isLoaded('javascript')` 为 true

#### Scenario: 同一语言先并发后串行加载
- **WHEN** 先并发 2 次 `loadLanguageAsync('python')`，等待完成后，再单独调用 `loadLanguageAsync('python')`
- **THEN** 并发阶段 `loadingPromises` 仅有 1 个条目（key 为 'python'），串行阶段走快速路径不触发 `loadLanguageModule`，`loadLanguageModule` mock 总共仅被调用 1 次

#### Scenario: 不同语言并发加载各自独立
- **WHEN** 同时发起 `loadLanguageAsync('javascript')`、`loadLanguageAsync('python')`、`loadLanguageAsync('rust')`
- **THEN** `loadingPromises` 中有 3 个独立条目，`loadLanguageModule` mock 被调用 3 次（每种语言各 1 次），3 种语言均标记为已加载

### Requirement: 已加载语言的快速路径不触发加载行为
系统 SHALL 在语言已加载时直接返回，不触发 `doLoadLanguage` 调用。

#### Scenario: 已加载语言重复调用
- **WHEN** 先 `loadLanguageAsync('go')` 完成，然后再调用 `loadLanguageAsync('go')` 10 次
- **THEN** `loadLanguageModule` mock 仅被调用 1 次（首次加载），后续 10 次不触发 `loadingPromises` 新增条目

### Requirement: 失败语言防重试机制
系统 SHALL 记录加载失败的语言，后续对同一语言的 `loadLanguageAsync` 调用 SHALL 直接抛出错误，不再调用 `doLoadLanguage`。

#### Scenario: 失败后重试被阻止
- **WHEN** `loadLanguageAsync('cobol')` 因 `loadLanguageModule` mock reject 而失败后，再次调用 `loadLanguageAsync('cobol')`
- **THEN** 第二次调用直接抛出错误，`loadLanguageModule` mock 总共仅被调用 1 次，`testInternals.failedLanguages` 中包含 'cobol'

#### Scenario: 失败语言不影响其他语言
- **WHEN** `loadLanguageAsync('cobol')` 失败后，调用 `loadLanguageAsync('javascript')`
- **THEN** `javascript` 正常加载成功，失败记录仅针对 `cobol`

### Requirement: codeBlockUpdater 重试计数在并发场景下精确
系统 SHALL 确保 `updateCodeBlockDOM` 在目标元素不存在时，精确重试 `maxRetries` 次后停止，不因并发调用而产生额外重试。

#### Scenario: 单次调用精确重试后停止
- **WHEN** 调用 `updateCodeBlockDOM('code', 'python', '<hl>')` 且 DOM 中无匹配元素，maxRetries=3
- **THEN** 总共尝试 4 次（初始 1 次 + 重试 3 次），之后不再有更多 setTimeout 回调

#### Scenario: 同一语言两个不同代码块并发更新
- **WHEN** 同时调用 `updateCodeBlockDOM('code-a', 'python', '<hl-a>')` 和 `updateCodeBlockDOM('code-b', 'python', '<hl-b>')`，DOM 中有 `code-a` 的元素但无 `code-b` 的元素
- **THEN** `code-a` 成功更新，`code-b` 精确重试 maxRetries 次后停止，两个更新互不干扰

#### Scenario: 元素在重试过程中出现后成功更新
- **WHEN** 调用 `updateCodeBlockDOM('code', 'js', '<hl>')` 后，在第 1 次重试前将匹配元素插入 DOM
- **THEN** 第 1 次重试时成功更新 innerHTML，不再继续重试

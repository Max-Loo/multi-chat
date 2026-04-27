## Purpose

验证 `highlightLanguageIndex` 工具函数的正确行为，包括已知语言到对应 highlight.js 动态 import 的路由以及未知语言的错误处理。

## Requirements

### Requirement: loadLanguageModule 正确路由已知语言到对应动态 import

`loadLanguageModule(lang)` 函数 SHALL 根据输入的语言标识符返回对应的 highlight.js 语言模块。对于所有 40 种已支持的语言（javascript、typescript、python、java、cpp、xml、css、bash、json、markdown、sql、go、rust、yaml、csharp、ruby、php、swift、kotlin、scala、objectivec、haskell、lua、perl、r、matlab、dart、elixir、erlang、clojure、fsharp、groovy、julia、powershell、dockerfile、nginx、apache、diff、plaintext），函数 SHALL 调用 `import('highlight.js/lib/languages/<lang>')` 并返回其结果。

> **注意**：测试仅选取代表性语言覆盖 switch 路由，不逐个 mock 全部 40 种语言模块。对未 mock 的语言分支，由 unknown-language error 测试间接保护。

#### Scenario: 加载预加载语言
- **WHEN** 调用 `loadLanguageModule('javascript')`
- **THEN** SHALL 调用 `import('highlight.js/lib/languages/javascript')` 并返回其结果

#### Scenario: 加载可选语言
- **WHEN** 调用 `loadLanguageModule('elixir')`
- **THEN** SHALL 调用 `import('highlight.js/lib/languages/elixir')` 并返回其结果

#### Scenario: 加载边缘语言
- **WHEN** 调用 `loadLanguageModule('plaintext')`
- **THEN** SHALL 调用 `import('highlight.js/lib/languages/plaintext')` 并返回其结果

### Requirement: loadLanguageModule 对未知语言抛出错误

`loadLanguageModule(lang)` 函数 SHALL 在输入不在 40 种已支持语言列表中时，抛出包含语言标识符的 `Error`。

#### Scenario: 传入不支持的语言标识符
- **WHEN** 调用 `loadLanguageModule('brainfuck')`
- **THEN** SHALL 抛出 `Error`，错误消息包含 `'brainfuck'`

#### Scenario: 传入空字符串
- **WHEN** 调用 `loadLanguageModule('')`
- **THEN** SHALL 抛出 `Error`

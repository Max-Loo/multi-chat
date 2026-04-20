## ADDED Requirements

### Requirement: escapeHtml 通过 DOM API 转义 HTML 特殊字符
系统 SHALL 通过 DOM API（`document.createElement` 的 `textContent→innerHTML` 机制）转义 `<`、`>`、`&` 三种 HTML 特殊字符。注意：DOM API 在文本节点上下文中不会转义 `"` 和 `'`，如需完整转义（含 `"`、`'`、`/`），应使用 `escapeHtmlManual`。此函数依赖 happy-dom 环境。

#### Scenario: 转义包含 HTML 标签的字符串
- **WHEN** 调用 `escapeHtml('<script>alert("xss")</script>')`
- **THEN** 返回值中 `<` 被转义为 `&lt;`，`>` 被转义为 `&gt;`，`&` 被转义为 `&amp;`（双引号保持原样，因 DOM API 不在文本节点中转义引号）

#### Scenario: 转义空字符串
- **WHEN** 调用 `escapeHtml('')`
- **THEN** 返回空字符串 `''`

#### Scenario: 无特殊字符的字符串不改变
- **WHEN** 调用 `escapeHtml('hello world')`
- **THEN** 返回 `'hello world'`

#### Scenario: 正确处理 CJK 字符和 emoji
- **WHEN** 调用 `escapeHtml('你好世界😀<b>bold</b>')`
- **THEN** CJK 和 emoji 保持原样，HTML 标签被转义

### Requirement: escapeHtmlManual 正确转义所有 HTML 特殊字符
系统 SHALL 通过正则替换正确转义 `&`、`<`、`>`、`"`、`'`、`/` 六种字符。此函数为纯字符串操作，不依赖 DOM 环境，可作为 `escapeHtml` 的无 DOM 备选方案。

#### Scenario: 手动转义包含所有特殊字符的字符串
- **WHEN** 调用 `escapeHtmlManual('a&b<c>d"e\'f/g')`
- **THEN** 返回 `'a&amp;b&lt;c&gt;d&quot;e&#39;f&#x2F;g'`

#### Scenario: 两种实现结果一致
- **WHEN** 对同一包含特殊字符的字符串分别调用 `escapeHtml` 和 `escapeHtmlManual`
- **THEN** 两者返回的转义结果在语义上等价（字符实体指向相同字符）

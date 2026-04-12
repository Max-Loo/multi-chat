# Purpose

定义 HTML 转义函数（`escapeHtml`、`escapeHtmlManual`）的测试规范，确保 HTML 特殊字符转义正确性、XSS 防护有效性和两种实现的核心字符一致性。

# Requirements

### Requirement: escapeHtmlManual 转义正确性
`escapeHtmlManual` SHALL 将 HTML 特殊字符（`& < > " ' /`）转义为对应的 HTML 实体。

#### Scenario: 转义所有特殊字符
- **WHEN** 输入包含 `& < > " ' /` 的字符串
- **THEN** 输出 MUST 将这些字符分别转义为 `&amp; &lt; &gt; &quot; &#39; &#x2F;`

#### Scenario: 空字符串输入
- **WHEN** 输入为空字符串
- **THEN** 输出 MUST 为空字符串

#### Scenario: 无特殊字符的字符串
- **WHEN** 输入不包含任何 HTML 特殊字符
- **THEN** 输出 MUST 与输入相同

### Requirement: escapeHtml 转义正确性
`escapeHtml`（DOM API 实现）SHALL 将 HTML 特殊字符 `&`、`<`、`>` 转义为对应的 HTML 实体。注意：jsdom 的 DOM API 不转义 `"`、`'`、`/`，这与浏览器行为一致。

#### Scenario: 转义核心特殊字符
- **WHEN** 输入包含 `&`、`<`、`>` 的字符串
- **THEN** 输出 MUST 将这些字符分别转义为 `&amp;`、`&lt;`、`&gt;`（注意：jsdom DOM API 不转义 `"`、`'`、`/`）

#### Scenario: 空字符串输入
- **WHEN** 输入为空字符串
- **THEN** 输出 MUST 为空字符串

#### Scenario: 无特殊字符的字符串
- **WHEN** 输入不包含任何 HTML 特殊字符
- **THEN** 输出 MUST 与输入相同

### Requirement: XSS 防护验证
转义后的内容 SHALL 能防止 XSS 攻击向量。

#### Scenario: script 标签注入
- **WHEN** 输入包含 `<script>alert('xss')</script>`
- **THEN** 输出 MUST 不包含可执行的 script 标签

#### Scenario: 事件处理器注入
- **WHEN** 输入包含 `<img onerror="alert('xss')">`
- **THEN** 输出 MUST 不包含可执行的事件处理器

#### Scenario: JavaScript 协议注入
- **WHEN** 输入包含 `javascript:alert('xss')`
- **THEN** 输出 MUST 转义特殊字符使其不可执行

### Requirement: 两种实现核心字符一致性
`escapeHtml`（DOM API 实现）和 `escapeHtmlManual`（正则替换实现）MUST 对核心 XSS 相关字符 `&`、`<`、`>`、`"`、`'` 产生相同输出。

#### Scenario: 核心字符一致性测试
- **WHEN** 对包含核心特殊字符 `&`、`<`、`>`、`"`、`'` 的输入分别调用两个函数
- **THEN** 对 `&`、`<`、`>` 三者输出 MUST 完全相同；对 `"`、`'`、`/` 三者输出 MUST 不同（jsdom DOM API 不转义这三个字符，`escapeHtmlManual` 转义为 `&quot;`、`&#39;`、`&#x2F;`）

#### Scenario: 无特殊字符和 Unicode 输入一致性
- **WHEN** 对不包含特殊字符的输入、中文、emoji、混合内容分别调用两个函数
- **THEN** 两者的输出 MUST 完全相同

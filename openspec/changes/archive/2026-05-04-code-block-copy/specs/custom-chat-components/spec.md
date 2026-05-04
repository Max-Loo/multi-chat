## MODIFIED Requirements

### Requirement: 聊天气泡应支持 Markdown 渲染和代码高亮

系统 SHALL 在聊天气泡中渲染 Markdown 格式的文本，为代码块提供语法高亮，并在每个代码块上提供复制按钮。

#### Scenario: 渲染 Markdown 内容

- **WHEN** 消息内容包含 Markdown 格式时
- **THEN** 系统应将 Markdown 转换为安全的 HTML
- **AND** 应清理潜在的恶意脚本（XSS 防护）
- **AND** 应正确渲染标题、列表、链接等 Markdown 元素

#### Scenario: 高亮代码块

- **WHEN** 消息内容包含代码块时
- **THEN** 系统应检测代码语言
- **AND** 应用语法高亮
- **AND** 未识别语言时使用自动高亮

#### Scenario: 代码块包含复制按钮

- **WHEN** 消息内容包含代码块（ fenced code block ）
- **THEN** 渲染后的 HTML SHALL 在代码块容器右上角包含一个复制按钮
- **AND** 复制按钮的 HTML 结构通过 `DOMPurify` 白名单，不被过滤
- **AND** 行内代码（ inline code ）不包含复制按钮

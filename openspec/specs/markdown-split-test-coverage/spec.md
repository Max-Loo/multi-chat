## ADDED Requirements

### Requirement: 流式增量输入模式测试
`findSafeSplitPoint` SHALL 在内容逐步追加时正确返回最后一个安全分割点。测试 SHALL 覆盖以下场景：

#### Scenario: 内容逐步追加时 split point 逐步推进
- **WHEN** 内容依次为 "A"、"A\n\nB"、"A\n\nB\n\nC"
- **THEN** 每次调用返回对应内容中最后一个空行位置，且 `content.slice(result)` 以空行开头

#### Scenario: 内容缩短时 split point 回退
- **WHEN** 内容从 "A\n\nB\n\nC" 缩短为 "A\n\nB"
- **THEN** split point 回退到 "A\n\nB" 中最后一个空行位置

#### Scenario: 流式追加到未关闭代码块中
- **WHEN** 内容为 "```\ncode\n"（未关闭），之后追加为 "```\ncode\n\nstill code"
- **THEN** 因代码块未关闭，追加的空行不被识别为安全分割点，返回 0

### Requirement: 实际 LLM 输出模式测试
`findSafeSplitPoint` SHALL 正确处理实际 LLM 输出中常见的模式。

#### Scenario: 纯代码块消息
- **WHEN** 内容以 ``` 开头，如 "```\ncode\n```\n"
- **THEN** 返回 0（代码块关闭后无有效安全分割点，末尾隐式空行被排除）

#### Scenario: 极短消息
- **WHEN** 内容为单字符 "x" 或空行 "\n"
- **THEN** 返回 0（无安全分割点）

#### Scenario: 连续调用结果一致性
- **WHEN** 对同一字符串连续多次调用 `findSafeSplitPoint`
- **THEN** 每次返回相同结果（纯函数无副作用）

#### Scenario: 内容以换行符开头
- **WHEN** 内容为 "\nHello\n\nWorld"
- **THEN** 正确返回最后一个安全分割点（World 前的空行）

### Requirement: 复杂 Markdown 结构测试
`findSafeSplitPoint` SHALL 正确处理复杂 Markdown 结构中的空行。

#### Scenario: 列表项之间的空行
- **WHEN** 内容为 "- item1\n\n- item2\n\n- item3"
- **THEN** 返回最后一个列表项前的空行位置

#### Scenario: 引用块内的空行
- **WHEN** 内容为 "> line1\n>\n> line2\n\nAfter"
- **THEN** 返回引用块后的空行位置，而非引用块内 `>` 空行的位置

#### Scenario: 标题前后的空行
- **WHEN** 内容为 "# Title\n\n## Subtitle\n\nParagraph"
- **THEN** 返回最后一个标题后的空行位置

#### Scenario: 文本中包含 ``` 但不以 ``` 开头的行
- **WHEN** 内容为 "Use ``` to start a code block\n\nNew paragraph"
- **THEN** 该行不以 ``` 开头（以 "Use" 开头），不触发代码块检测；空行在代码块外，是有效的安全分割点

#### Scenario: HTML 标签内的空行
- **WHEN** 内容为 "<div>\n\ncontent\n\n</div>\n\nAfter"
- **THEN** HTML 标签内的空行在代码块外，作为安全分割点处理

### Requirement: 极端边界测试
`findSafeSplitPoint` SHALL 正确处理极端输入。

#### Scenario: 仅包含代码围栏标记
- **WHEN** 内容仅为 "```"
- **THEN** 返回 0（代码块未关闭，无安全分割点）

#### Scenario: 连续多个空行
- **WHEN** 内容为 "A\n\n\n\nB"
- **THEN** 返回最后一个空行的起始位置（B 前最近的位置）

#### Scenario: 超长单行内容
- **WHEN** 内容为 10000 字符的单行后跟空行和短文本
- **THEN** 正确返回空行位置

#### Scenario: CRLF 换行符
- **WHEN** 内容使用 "\r\n" 作为换行符，如 "Hello\r\n\r\nWorld"
- **THEN** 函数按 "\n" 扫描，"\r" 行 trim() 后为空被视为空行，返回该空行位置（非 0）

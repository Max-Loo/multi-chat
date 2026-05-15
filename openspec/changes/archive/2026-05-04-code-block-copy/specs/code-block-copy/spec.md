## ADDED Requirements

### Requirement: 代码块复制按钮渲染

系统 SHALL 在每个由 Markdown 渲染的代码块（`<pre><code>`）右上角显示一个复制按钮。

#### Scenario: 有语言标记的代码块显示复制按钮
- **WHEN** Markdown 内容包含带语言标记的代码块（如 ` ```javascript `）
- **THEN** 渲染后的 HTML SHALL 在 `<pre>` 外包裹一个容器元素
- **AND** 容器右上角 SHALL 显示一个复制按钮
- **AND** 复制按钮包含一个复制图标（SVG）

#### Scenario: 无语言标记的代码块显示复制按钮
- **WHEN** Markdown 内容包含无语言标记的代码块（` ``` `）
- **THEN** 渲染后的 HTML SHALL 同样显示复制按钮

#### Scenario: 行内代码不显示复制按钮
- **WHEN** Markdown 内容包含行内代码（`` `code` ``）
- **THEN** 不渲染复制按钮

---

### Requirement: 点击复制按钮复制代码内容

系统 SHALL 在用户点击复制按钮时，将代码块的纯文本内容复制到系统剪贴板。

#### Scenario: 成功复制代码
- **WHEN** 用户点击代码块的复制按钮
- **THEN** 系统从 `<code>` 元素的 `textContent` 提取纯文本代码内容
- **AND** 调用 `copyToClipboard` 将纯文本写入剪贴板
- **AND** 复制的文本不包含高亮 HTML 标记，仅包含原始代码文本

#### Scenario: 复制包含中文注释的代码
- **WHEN** 代码块中包含非 ASCII 字符（如中文注释）
- **THEN** 复制的文本 SHALL 完整保留非 ASCII 字符，不出现乱码

#### Scenario: 复制失败时的降级处理
- **WHEN** 剪贴板写入失败
- **THEN** 系统显示复制失败的 Toast 提示
- **AND** 复制按钮恢复到初始状态，允许重试

---

### Requirement: 复制状态反馈

系统 SHALL 在复制成功后提供视觉反馈，告知用户复制已完成。

#### Scenario: 复制成功后按钮状态变化
- **WHEN** 代码复制成功
- **THEN** 复制按钮图标 SHALL 从"复制"变为"已复制"状态（如勾选图标）
- **AND** 按钮的 `title` 属性更新为"已复制"文案

#### Scenario: 复制状态自动恢复
- **WHEN** 复制成功并显示"已复制"状态后
- **THEN** 2 秒后按钮 SHALL 自动恢复到初始"复制"状态
- **AND** 图标恢复为复制图标
- **AND** `title` 属性恢复为"复制代码"文案

---

### Requirement: 复制按钮不影响代码高亮

系统 SHALL 确保复制按钮的注入不影响现有的代码高亮功能。

#### Scenario: 预加载语言的代码块正常高亮
- **WHEN** 代码块使用预加载语言（如 JavaScript、Python）
- **THEN** 代码高亮正常显示
- **AND** 复制按钮正常显示在右上角

#### Scenario: 异步加载语言的代码块正常高亮
- **WHEN** 代码块使用需要异步加载的语言
- **THEN** 复制按钮在初始纯文本阶段即显示
- **AND** 语言加载完成后代码高亮正常替换，复制按钮不受影响

#### Scenario: 不支持语言的代码块显示复制按钮
- **WHEN** 代码块使用 highlight.js 不支持的语言
- **THEN** 代码以纯文本显示
- **AND** 复制按钮仍然正常显示并可点击

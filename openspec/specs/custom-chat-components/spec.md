# Custom Chat Components

## Purpose

定义自定义聊天气泡组件的规格，支持用户和 AI 助手消息展示、Markdown 渲染、代码高亮和推理内容折叠等功能。

本规格替代 `@ant-design/x` 依赖，使用 shadcn/ui 和 Radix UI 实现轻量级聊天组件。

## Requirements

### Requirement: 聊天气泡应支持用户和 AI 助手两种角色展示

系统 SHALL 提供聊天气泡组件，支持用户消息和 AI 助手消息的展示，通过左/右对齐区分角色，并在消息气泡上提供操作工具栏。

#### Scenario: 显示用户消息

- **WHEN** 渲染用户角色的消息时
- **THEN** 消息气泡应右对齐显示
- **AND** 气泡应使用用户专用样式（如灰色背景）
- **AND** 显示用户消息当前版本的文本内容

#### Scenario: 显示 AI 助手消息

- **WHEN** 渲染 AI 助手角色的消息时
- **THEN** 消息气泡应左对齐显示
- **AND** 气泡应使用无边框样式
- **AND** 显示 AI 助手当前版本的文本内容

#### Scenario: 用户消息显示操作工具栏

- **WHEN** 渲染用户角色的消息时
- **AND** 该消息不是正在发送中的消息
- **THEN** 在气泡左下角固定显示操作工具栏
- **AND** 若为最新用户消息，工具栏包含：复制、编辑按钮（纯图标）
- **AND** 若为非最新用户消息，工具栏包含：复制按钮（纯图标）
- **AND** 鼠标悬停图标时通过 tooltip 显示按钮文字描述

#### Scenario: AI 助手消息显示操作工具栏

- **WHEN** 渲染 AI 助手角色的消息时
- **AND** 该消息不是正在发送中的消息
- **THEN** 在气泡左下角固定显示操作工具栏
- **AND** 工具栏包含：复制按钮（纯图标）
- **AND** 若 `isLastAssistant` 为 true，额外显示重新生成按钮
- **AND** 鼠标悬停图标时通过 tooltip 显示按钮文字描述

#### Scenario: 消息正在发送时不显示操作栏

- **WHEN** 消息对应的聊天正在发送中（`isRunning` 为 true）
- **THEN** 操作工具栏不显示

---

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

---

### Requirement: AI 推理内容应支持折叠/展开交互

系统 SHALL 为 AI 的推理内容（thinking process）提供可折叠的展示区域，用户可以控制显示/隐藏。

#### Scenario: 显示推理内容区域

- **WHEN** AI 消息包含推理内容时
- **THEN** 系统应在正式回复前显示推理内容区域
- **AND** 显示推理状态标题（"思考中" 或 "思考完成"）
- **AND** 默认展开状态（如果正在生成）

#### Scenario: 用户折叠推理内容

- **WHEN** 用户点击推理区域的折叠按钮
- **THEN** 系统应隐藏推理内容
- **AND** 保持折叠状态

#### Scenario: 用户展开推理内容

- **WHEN** 用户点击推理区域的展开按钮
- **THEN** 系统应显示推理内容
- **AND** 支持在推理内容中渲染 Markdown

---

### Requirement: 推理内容应显示加载状态

系统 SHALL 在 AI 正在生成推理内容时，显示加载动画或提示。

#### Scenario: 显示加载状态

- **WHEN** AI 正在生成推理内容但尚未生成正式回复时
- **THEN** 系统应显示"思考中"标题
- **AND** 可以显示加载动画或指示器
- **AND** 推理内容区域默认展开

#### Scenario: 思考完成后折叠

- **WHEN** AI 生成正式回复后
- **THEN** 系统应将推理内容区域自动折叠
- **AND** 标题更新为"思考完成"

---

### Requirement: 聊天气泡应支持正在运行状态

系统 SHALL 支持显示正在生成中的消息气泡，提供实时反馈。

#### Scenario: 显示运行中的气泡

- **WHEN** 消息正在生成中时
- **THEN** 系统应显示加载动画或占位符
- **AND** 支持中断生成操作
- **AND** 不显示消息操作工具栏

---

### Requirement: 聊天组件不应引入新的重量级依赖

系统 SHALL 在不增加外部依赖的情况下实现聊天组件功能。

#### Scenario: 依赖约束验证

- **WHEN** 检查项目依赖时
- **THEN** 不应引入超过 1MB 的新库
- **AND** 应优先使用项目中已有的 UI 组件库
- **AND** 不应引入新的 UI 框架（如 Material-UI, Ant Design）

#### Scenario: 使用现有组件栈

- **WHEN** 实现聊天组件时
- **THEN** 应使用项目中已有的 shadcn/ui 组件
- **AND** 应使用项目中已有的 Radix UI 组件
- **AND** 应使用 Tailwind CSS 进行样式定制

---

### Requirement: 系统应移除 @ant-design/x 依赖

系统 SHALL 完全移除 @ant-design/x 及其隐式依赖 antd，使用自定义组件替代。

#### Scenario: 移除依赖

- **WHEN** 自定义组件实现并测试完成后
- **THEN** 系统应从 package.json 移除 @ant-design/x
- **AND** 隐式移除 antd peer dependency
- **AND** node_modules 体积减少约 81MB

#### Scenario: 保持功能一致

- **WHEN** 使用自定义组件替换后
- **THEN** 所有聊天功能应保持不变
- **AND** 用户不应感知到组件切换
- **AND** 测试用例全部通过

---

### Requirement: ChatBubble 组件支持编辑模式

系统 SHALL 支持 ChatBubble 进入行内编辑模式，用户可直接在气泡内修改消息文本。

#### Scenario: 进入编辑模式

- **WHEN** 用户点击最新用户消息上的编辑按钮
- **THEN** 消息气泡的文本内容区替换为 `<Textarea>` 组件
- **AND** Textarea 预填当前消息文本
- **AND** Textarea 自动获得焦点并将光标置于文本末尾
- **AND** 操作栏切换为确认和取消按钮

#### Scenario: 编辑模式下的确认操作

- **WHEN** 用户在编辑模式的 Textarea 中按 Enter 键（非 Shift+Enter）
- **THEN** 触发 `onEdit` 回调，传入 messageId 和修改后的文本内容

#### Scenario: 编辑模式下的取消操作

- **WHEN** 用户在编辑模式下按 Escape 键
- **OR** 用户点击取消按钮
- **THEN** 退出编辑模式，恢复原始文本展示

#### Scenario: 编辑模式下内容为空时禁用确认

- **WHEN** 编辑模式中 Textarea 内容为空或仅包含空白字符
- **THEN** 确认按钮处于禁用状态

---

### Requirement: ChatBubble 组件支持编辑历史翻页

系统 SHALL 支持在 ChatBubble 中浏览消息的编辑历史版本。

#### Scenario: 显示编辑历史翻页控件

- **WHEN** 消息的 `content` 为 `string[]`（长度大于 1）
- **THEN** 在气泡下方显示翻页控件
- **AND** 显示当前版本号和总版本数（如"2/3"）

#### Scenario: 翻页查看历史版本

- **WHEN** 用户点击翻页控件的前进/后退按钮
- **THEN** 气泡内容切换为对应下标的内容
- **AND** 同一编辑轮次的用户消息和 AI 回复成对展示（使用相同下标）

#### Scenario: 无编辑历史时不显示翻页控件

- **WHEN** 消息的 `content` 为 `string`
- **THEN** 不显示翻页控件

---

### Requirement: isContentEqual 使用全数组逐元素比较
ChatBubble 的 `isContentEqual` 函数 SHALL 对 string[] 类型进行全数组逐元素比较（`a.every((val, i) => val === b[i])`），而非仅比较末尾元素和长度。

#### Scenario: 数组中间元素变化时检测到差异
- **WHEN** prevProps.content 为 ["a", "b", "c"] 且 nextProps.content 为 ["a", "x", "c"]
- **THEN** isContentEqual 返回 false，触发重渲染

#### Scenario: 完全相同的数组返回 true
- **WHEN** prevProps.content 为 ["a", "b"] 且 nextProps.content 为 ["a", "b"]
- **THEN** isContentEqual 返回 true，跳过重渲染

---

### Requirement: currentContent/currentReasoning 使用 getContentAtIndex
ChatBubble 中 `currentContent` 和 `currentReasoning` 的 useMemo 计算 SHALL 使用 chatHistoryHelper 的 `getContentAtIndex` 函数，替代内联的数组索引访问逻辑。

#### Scenario: 数组内容按索引提取
- **WHEN** content 为 ["v1", "v2", "v3"] 且 historyIndex 为 1
- **THEN** 使用 `getContentAtIndex(content, 1)` 返回 "v2"

#### Scenario: 字符串内容直接返回
- **WHEN** content 为 "hello" 且 historyIndex 为 0
- **THEN** `getContentAtIndex(content, 0)` 返回 "hello"

---

### Requirement: 删除不必要的代码注释
ChatBubble、Detail/index、chatHistoryHelper、markdown.ts 中解释代码行为（WHAT）的注释 SHALL 被删除，仅保留解释非显而易见的 WHY 的注释。约 25 行注释需移除。

#### Scenario: 自明注释被删除
- **WHEN** 注释内容仅复述紧接的标识符或语句含义（如 `// 用户对话气泡` 紧接 `case ChatRoleEnum.USER`）
- **THEN** 该注释被删除

#### Scenario: WHY 注释被保留
- **WHEN** 注释解释了非显而易见的约束或变通方案（如流式保护逻辑的原因）
- **THEN** 该注释被保留

---

### Requirement: ThinkingSection 使用 div 替代无意义的 Card 包裹
ThinkingSection 中 `<Card className="mb-2 bg-transparent border-none shadow-none">` SHALL 替换为 `<div className="mb-2">`，因为 Card 的所有视觉特征（border、shadow、background）都被重置为无，多引入了一层无意义的 DOM 嵌套。

#### Scenario: ThinkingSection 渲染为简洁的 div
- **WHEN** ThinkingSection 组件渲染推理内容折叠区域
- **THEN** 使用 `<div className="mb-2">` 作为外层容器，不引入 Card 组件

---

### Requirement: generateCleanHtml 空字符串短路
`generateCleanHtml` 函数 SHALL 在输入为空字符串时直接返回空字符串，跳过 markdown-it 解析和 DOMPurify 过滤。

#### Scenario: 空字符串输入快速返回
- **WHEN** generateCleanHtml 接收空字符串 ""
- **THEN** 直接返回 ""，不执行 markdown 渲染管线

---

### Requirement: chatMiddleware action type 使用类型安全匹配
chatMiddleware 中 `action.type === 'chatModel/sendMessage/fulfilled'` 字符串硬编码 SHALL 替换为导入 `sendMessage` 后使用 `sendMessage.fulfilled.match(action)`（改用 `matcher` 字段替代 `predicate`，因为 currentState 和 previousState 均未使用）。

#### Scenario: sendMessage.fulfilled 触发标题生成
- **WHEN** sendMessage 异步 thunk 成功完成
- **THEN** 通过 `matcher: sendMessage.fulfilled.match` 匹配 action，效果与原字符串比较一致

#### Scenario: 其他 action 不触发
- **WHEN** 非 sendMessage.fulfilled 的 action 被 dispatch
- **THEN** matcher 返回 false，不触发标题生成逻辑

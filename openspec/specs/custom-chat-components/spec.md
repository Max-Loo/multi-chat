# Custom Chat Components

## Purpose

定义自定义聊天气泡组件的规格，支持用户和 AI 助手消息展示、Markdown 渲染、代码高亮和推理内容折叠等功能。

本规格替代 `@ant-design/x` 依赖，使用 shadcn/ui 和 Radix UI 实现轻量级聊天组件。

## Requirements

### Requirement: 聊天气泡应支持用户和 AI 助手两种角色展示

系统 SHALL 提供聊天气泡组件，支持用户消息和 AI 助手消息的展示，通过左/右对齐区分角色。

#### Scenario: 显示用户消息

- **WHEN** 渲染用户角色的消息时
- **THEN** 消息气泡应右对齐显示
- **AND** 气泡应使用用户专用样式（如蓝色背景）
- **AND** 显示用户消息的文本内容

#### Scenario: 显示 AI 助手消息

- **WHEN** 渲染 AI 助手角色的消息时
- **THEN** 消息气泡应左对齐显示
- **AND** 气泡应使用无边框样式
- **AND** 显示 AI 助手的文本内容

---

### Requirement: 聊天气泡应支持 Markdown 渲染和代码高亮

系统 SHALL 在聊天气泡中渲染 Markdown 格式的文本，并为代码块提供语法高亮。

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

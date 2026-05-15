## MODIFIED Requirements

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

### Requirement: 聊天气泡应支持正在运行状态

系统 SHALL 支持显示正在生成中的消息气泡，提供实时反馈。

#### Scenario: 显示运行中的气泡

- **WHEN** 消息正在生成中时
- **THEN** 系统应显示加载动画或占位符
- **AND** 支持中断生成操作
- **AND** 不显示消息操作工具栏

---

## ADDED Requirements

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

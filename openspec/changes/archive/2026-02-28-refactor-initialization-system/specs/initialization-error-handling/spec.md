# 规格文档：初始化错误处理系统

## ADDED Requirements

### Requirement: 三级错误分类

系统 MUST 根据错误的严重程度将初始化错误分为三个级别：
- **致命错误（fatal）**：应用完全无法使用
- **警告错误（warning）**：功能降级但仍可用
- **可忽略错误（ignorable）**：不影响核心功能

每个初始化步骤 MUST 能够通过 `onError` 回调函数定义错误的严重程度和处理策略。

#### Scenario: 定义致命错误
- **WHEN** 某个初始化步骤失败导致应用无法正常运行
- **THEN** 该步骤的 `onError` 回调 MUST 返回 `severity: 'fatal'`
- **AND** 系统 MUST 显示全屏错误提示
- **AND** 应用 MUST 停止启动流程

#### Scenario: 定义警告错误
- **WHEN** 某个初始化步骤失败但应用仍能降级运行
- **THEN** 该步骤的 `onError` 回调 MUST 返回 `severity: 'warning'`
- **AND** 系统 MUST 显示 Toast 通知
- **AND** 应用 MUST 继续启动流程

#### Scenario: 定义可忽略错误
- **WHEN** 某个初始化步骤失败但不影响核心功能
- **THEN** 该步骤的 `onError` 回调 MUST 返回 `severity: 'ignorable'`
- **AND** 系统 MUST 在控制台输出错误信息
- **AND** 应用 MUST 继续启动流程

#### Scenario: 默认错误严重程度
- **WHEN** 步骤未定义 `onError` 回调
- **THEN** 系统 MUST 根据步骤的 `critical` 属性决定严重程度
- **AND** 如果 `critical: true`，错误 MUST 被视为 `fatal`
- **AND** 如果 `critical: false`，错误 MUST 被视为 `warning`

---

### Requirement: 致命错误处理

系统 MUST 在发生致命错误时显示全屏错误提示。

全屏错误提示 MUST 包含：
- 错误图标
- 错误标题
- 错误描述（用户友好的消息）
- 刷新页面按钮（开发模式下显示技术细节）

#### Scenario: 致命错误导致应用停止
- **WHEN** 初始化过程中发生致命错误
- **THEN** 系统 MUST 渲染全屏错误提示组件
- **AND** 应用 MUST 不再继续执行后续步骤
- **AND** 用户界面 MUST 显示错误详情和恢复建议

#### Scenario: 致命错误提供刷新选项
- **WHEN** 全屏错误提示显示
- **THEN** 页面 MUST 包含"刷新页面"按钮
- **AND** 点击按钮 MUST 调用 `window.location.reload()`
- **AND** 页面 MUST 重新加载，重新执行初始化流程

#### Scenario: 开发模式显示技术细节
- **WHEN** 应用运行在开发模式（`import.meta.env.DEV`）
- **AND** 发生致命错误
- **THEN** 全屏错误提示 MUST 显示错误堆栈信息
- **AND** 堆栈信息 MUST 在可折叠的 `<details>` 元素中
- **AND** 生产模式 MUST 不显示堆栈信息

#### Scenario: 多个致命错误同时显示
- **WHEN** 初始化过程中有多个致命错误发生
- **THEN** 全屏错误提示 MUST 显示所有致命错误
- **AND** 每个错误 MUST 以独立的 `<Alert>` 组件展示
- **AND** 错误列表 MUST 按发生顺序排列

---

### Requirement: 警告错误处理

系统 MUST 在发生警告错误时显示 Toast 通知，不打断用户操作。

Toast 通知 MUST 包含：
- 警告图标
- 警告消息（用户友好的描述）
- 自动关闭（除非特别指定）

#### Scenario: 警告错误显示 Toast
- **WHEN** 初始化过程中发生警告错误
- **THEN** 系统 MUST 显示 Toast 通知
- **AND** Toast MUST 不阻塞用户界面
- **AND** 用户 MUST 能够继续使用应用

#### Scenario: 多个警告错误批量显示
- **WHEN** 初始化过程中有多个警告错误发生
- **THEN** 系统 MUST 为每个警告错误显示独立的 Toast
- **AND** Toast MUST 按错误发生顺序依次显示
- **AND** 用户 MUST 能够逐个关闭或自动关闭

#### Scenario: 警告错误不影响应用启动
- **WHEN** 初始化过程中发生警告错误
- **AND** 没有致命错误发生
- **THEN** 应用 MUST 成功启动
- **AND** 用户 MUST 能够正常使用应用

#### Scenario: 警告错误不影响后续步骤
- **WHEN** 某个非关键步骤发生警告错误
- **THEN** 系统 MUST 继续执行后续步骤
- **AND** 警告错误 MUST 不阻止应用初始化完成

---

### Requirement: 可忽略错误处理

系统 MUST 在发生可忽略错误时在控制台输出错误信息。

控制台输出 MUST 包含：
- 错误级别标识（如 `[Initialization]`）
- 步骤名称
- 错误消息
- 错误堆栈（开发模式）

#### Scenario: 可忽略错误输出到控制台
- **WHEN** 初始化过程中发生可忽略错误
- **THEN** 系统 MUST 使用 `console.error()` 输出错误
- **AND** 错误信息 MUST 包含步骤名称
- **AND** 错误信息 MUST 包含错误描述

#### Scenario: 可忽略错误不显示在 UI
- **WHEN** 初始化过程中发生可忽略错误
- **THEN** 系统 MUST 不在 UI 中显示任何错误提示
- **AND** 用户 MUST 能够正常使用应用
- **AND** 用户 MUST 不感知到错误发生

#### Scenario: 开发者通过控制台调试
- **WHEN** 开发者打开浏览器控制台
- **AND** 初始化过程中发生了可忽略错误
- **THEN** 控制台 MUST 显示完整的错误信息
- **AND** 错误信息 MUST 帮助开发者定位问题

---

### Requirement: 错误信息国际化

系统 MUST 支持错误信息的国际化。

错误信息 MUST 能够：
- 支持多语言（中文、英文）
- 使用 i18next 的翻译 key
- 根据系统语言自动选择对应的错误消息

#### Scenario: 中文环境显示中文错误
- **WHEN** 应用语言设置为中文
- **AND** 初始化过程中发生错误
- **THEN** 错误提示 MUST 显示中文错误消息
- **AND** 错误消息 MUST 符合中文表达习惯

#### Scenario: 英文环境显示英文错误
- **WHEN** 应用语言设置为英文
- **AND** 初始化过程中发生错误
- **THEN** 错误提示 MUST 显示英文错误消息
- **AND** 错误消息 MUST 符合英文表达习惯

#### Scenario: 使用 i18next 翻译 key
- **WHEN** 步骤定义错误消息
- **THEN** 错误消息 SHOULD 使用 i18next 的翻译 key
- **AND** 系统 MUST 能够根据当前语言解析 key
- **AND** 系统 MUST 显示对应语言的错误消息

---

### Requirement: 错误恢复策略

系统 MUST 为不同级别的错误提供适当的恢复策略。

恢复策略 MUST 包括：
- **致命错误**：刷新页面
- **警告错误**：无需操作（自动关闭 Toast）
- **可忽略错误**：无需操作

#### Scenario: 致命错误恢复
- **WHEN** 用户遇到致命错误
- **AND** 点击"刷新页面"按钮
- **THEN** 页面 MUST 重新加载
- **AND** 应用 MUST 重新执行初始化流程
- **AND** 如果错误是暂时的，应用 MUST 能够成功启动

#### Scenario: 警告错误无需恢复
- **WHEN** 用户看到警告错误 Toast
- **THEN** Toast MUST 在几秒后自动关闭
- **AND** 用户 MUST 能够继续使用应用
- **AND** 应用 MUST 在降级模式下正常运行

#### Scenario: 可忽略错误无需恢复
- **WHEN** 系统记录可忽略错误
- **THEN** 用户 MUST 不需要执行任何恢复操作
- **AND** 应用 MUST 正常运行

---

### Requirement: 错误日志记录

系统 MUST 记录所有初始化错误，便于调试和监控。

错误日志 MUST 包含：
- 错误发生时间
- 步骤名称
- 错误级别
- 错误消息
- 错误堆栈

#### Scenario: 记录致命错误
- **WHEN** 发生致命错误
- **THEN** 系统 MUST 在控制台输出完整的错误日志
- **AND** 日志 MUST 包含错误级别标识 `[FATAL]`
- **AND** 日志 MUST 包含步骤名称和错误堆栈

#### Scenario: 记录警告错误
- **WHEN** 发生警告错误
- **THEN** 系统 MUST 在控制台输出警告日志
- **AND** 日志 MUST 包含错误级别标识 `[WARNING]`
- **AND** 日志 MUST 包含步骤名称和错误消息

#### Scenario: 记录可忽略错误
- **WHEN** 发生可忽略错误
- **THEN** 系统 MUST 在控制台输出错误日志
- **AND** 日志 MUST 包含错误级别标识 `[IGNORABLE]`
- **AND** 日志 MUST 包含步骤名称和错误堆栈

---

### Requirement: 错误处理可扩展性

系统 MUST 支持自定义错误处理逻辑。

开发者 MUST 能够：
- 在 `onError` 回调中自定义错误严重程度
- 自定义错误消息
- 定义恢复操作（可选）

#### Scenario: 自定义错误消息
- **WHEN** 步骤定义 `onError` 回调
- **THEN** 回调函数 MUST 能够返回自定义的错误消息
- **AND** 错误消息 MUST 用户友好
- **AND** 错误消息 MUST 能够帮助用户理解问题

#### Scenario: 自定义恢复操作（未来扩展）
- **WHEN** 步骤定义 `onError` 回调
- **THEN** 回调函数 MAY 能够定义恢复操作
- **AND** 恢复操作 MAY 包括"重试"、"跳过"等选项
- **AND** 系统 MUST 能够根据恢复操作显示相应的按钮

#### Scenario: 动态判断错误严重程度
- **WHEN** 步骤定义 `onError` 回调
- **THEN** 回调函数 MUST 能够根据错误类型动态判断严重程度
- **AND** 不同类型的错误 MAY 有不同的严重程度
- **AND** 系统 MUST 根据返回的严重程度进行相应的处理

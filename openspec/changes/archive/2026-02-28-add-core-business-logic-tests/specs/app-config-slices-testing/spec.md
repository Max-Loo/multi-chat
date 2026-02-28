# App Config Slices Testing Specification

## ADDED Requirements

### Requirement: 应用语言初始化测试
测试系统 SHALL 验证 `initializeAppLanguage` async thunk 能正确从存储或系统获取应用语言设置。

#### Scenario: 成功初始化应用语言
- **WHEN** 调用 `initializeAppLanguage.fulfilled` action 并传入语言代码
- **THEN** 系统 SHALL 将语言代码更新到 store.state.appConfig.language

#### Scenario: 初始化失败
- **WHEN** 调用 `initializeAppLanguage.rejected` action
- **THEN** 系统 SHALL 传播错误信息到调用方

#### Scenario: 从 localStorage 获取默认语言
- **WHEN** localStorage 中存储了语言设置
- **THEN** 系统 SHALL 优先使用 localStorage 中的语言设置

#### Scenario: 从系统语言获取默认语言
- **WHEN** localStorage 中没有语言设置
- **THEN** 系统 SHALL 使用系统语言作为默认语言

#### Scenario: 回退到默认语言
- **WHEN** localStorage 和系统语言都不可用
- **THEN** 系统 SHALL 使用 'en' 作为回退语言

### Requirement: 推理内容开关初始化测试
测试系统 SHALL 验证 `initializeIncludeReasoningContent` async thunk 能正确从 localStorage 加载开关状态。

#### Scenario: 成功初始化开关状态为 true
- **WHEN** localStorage 中存储的值为 'true'
- **THEN** 系统 SHALL 将 includeReasoningContent 设置为 true

#### Scenario: 成功初始化开关状态为 false
- **WHEN** localStorage 中存储的值为 'false'
- **THEN** 系统 SHALL 将 includeReasoningContent 设置为 false

#### Scenario: localStorage 中无值
- **WHEN** localStorage 中没有存储该值
- **THEN** 系统 SHALL 将 includeReasoningContent 设置为 false（默认值）

#### Scenario: 初始化失败
- **WHEN** 调用 `initializeIncludeReasoningContent.rejected` action
- **THEN** 系统 SHALL 传播错误信息到调用方

### Requirement: 应用配置设置测试
测试系统 SHALL 验证应用配置相关的 reducers 能正确更新 Redux store 状态。

#### Scenario: 设置应用语言
- **WHEN** 调用 `setAppLanguage` action 并传入语言代码
- **THEN** 系统 SHALL 更新 language 字段为传入的语言代码

#### Scenario: 设置推理内容传输开关
- **WHEN** 调用 `setIncludeReasoningContent` action 并传入 true
- **THEN** 系统 SHALL 更新 includeReasoningContent 字段为 true
- **WHEN** 调用 `setIncludeReasoningContent` action 并传入 false
- **THEN** 系统 SHALL 更新 includeReasoningContent 字段为 false

### Requirement: localStorage 持久化测试
测试系统 SHALL 验证应用配置的中间件能正确持久化配置到 localStorage。

#### Scenario: 持久化语言设置
- **WHEN** 调用 `setAppLanguage` action
- **THEN** 系统 SHALL 将语言代码保存到 localStorage 的 'multi-chat-language' 键

#### Scenario: 持久化推理内容开关状态
- **WHEN** 调用 `setIncludeReasoningContent` action
- **THEN** 系统 SHALL 将开关状态保存到 localStorage 的 'multi-chat-include-reasoning-content' 键
- **THEN** 保存的值 SHALL 为字符串 'true' 或 'false'

#### Scenario: 中间件监听 language action
- **WHEN** dispatch setAppLanguage action
- **THEN** 中间件 SHALL 监听到该 action
- **THEN** 中间件 SHALL 调用 `changeAppLanguage` 函数更新 i18n 配置

#### Scenario: 中间件监听 includeReasoningContent action
- **WHEN** dispatch setIncludeReasoningContent action
- **THEN** 中间件 SHALL 监听到该 action
- **THEN** 中间件 SHALL 将状态保存到 localStorage

### Requirement: 应用配置选择器测试
测试系统 SHALL 验证应用配置的选择器能正确获取状态。

#### Scenario: 获取推理内容开关状态
- **WHEN** 调用 `selectIncludeReasoningContent` 选择器
- **THEN** 系统 SHALL 返回 store.state.appConfig.includeReasoningContent 的当前值

### Requirement: 国际化集成测试
测试系统 SHALL 验证应用配置与 i18n 系统的集成。

#### Scenario: 语言变更触发 i18n 更新
- **WHEN** 语言设置变更
- **THEN** 系统 SHALL 调用 `changeAppLanguage` 函数
- **THEN** i18n 实例 SHALL 使用新语言重新配置

#### Scenario: 初始化时加载语言资源
- **WHEN** 应用启动并调用 `initializeAppLanguage`
- **THEN** 系统 SHALL 从 getDefaultAppLanguage 获取默认语言
- **THEN** 系统 SHALL 确保语言资源已加载

### Requirement: 初始状态验证测试
测试系统 SHALL 验证应用配置的初始状态符合预期。

#### Scenario: 验证初始状态
- **WHEN** 创建 Redux store 时
- **THEN** language SHALL 为空字符串
- **THEN** includeReasoningContent SHALL 为 false

### Requirement: 错误处理测试
测试系统 SHALL 验证应用配置相关的错误处理机制。

#### Scenario: getDefaultAppLanguage 失败
- **WHEN** `getDefaultAppLanguage` 抛出异常
- **THEN** 系统 SHALL 捕获异常并传播到 rejected action
- **THEN** 错误信息 SHALL 包含失败原因

#### Scenario: localStorage 读取失败
- **WHEN** localStorage.getItem 抛出异常
- **THEN** 系统 SHALL 捕获异常并传播到 rejected action

### Requirement: 配置状态同步测试
测试系统 SHALL 验证配置状态在不同组件间的同步。

#### Scenario: 配置变更全局生效
- **WHEN** 在一个组件中修改应用配置
- **THEN** 所有使用该配置的组件 SHALL 立即获取到新值
- **THEN** Redux selector SHALL 返回更新后的值

### Requirement: 配置序列化测试
测试系统 SHALL 验证配置在存储和传输过程中的序列化正确性。

#### Scenario: 布尔值序列化
- **WHEN** 将 includeReasoningContent 保存到 localStorage
- **THEN** 系统 SHALL 将布尔值转换为字符串 'true' 或 'false'
- **WHEN** 从 localStorage 读取 includeReasoningContent
- **THEN** 系统 SHALL 将字符串转换回布尔值

#### Scenario: 语言代码存储格式
- **WHEN** 将 language 保存到 localStorage
- **THEN** 系统 SHALL 保持语言代码为字符串格式（如 'zh-CN', 'en'）

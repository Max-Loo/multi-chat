# 聊天标题自动生成功能规范

## ADDED Requirements

### Requirement: 自动生成标题触发条件
当且仅当以下三个条件同时满足时，系统必须触发聊天标题自动生成：
1. 全局自动命名开关 `autoNamingEnabled` 为 `true`
2. 当前聊天的 `name` 字段为空字符串或 `undefined`
3. 用户触发聊天消息发送且至少有一个模型完成回答

#### Scenario: 新建聊天首次收到 AI 回复
- **WHEN** 全局开关为打开状态
- **AND** 创建新聊天（标题为空）
- **AND** 用户发送第一条消息
- **AND** 第一个模型完成回答
- **THEN** 系统触发自动标题生成

#### Scenario: 历史聊天标题为空时收到回复
- **WHEN** 全局开关为打开状态
- **AND** 用户在历史聊天（标题为空）中发送消息
- **AND** 第一个模型完成回答
- **THEN** 系统触发自动标题生成

#### Scenario: 全局开关关闭时不触发
- **WHEN** 全局开关为关闭状态
- **AND** 聊天标题为空
- **AND** 用户发送消息且收到 AI 回复
- **THEN** 系统不触发自动标题生成

#### Scenario: 聊天已有标题时不触发
- **WHEN** 全局开关为打开状态
- **AND** 聊天已有标题（`name` 不为空）
- **AND** 用户发送消息且收到 AI 回复
- **THEN** 系统不触发自动标题生成

---

### Requirement: 标题生成时机
系统必须在第一个模型完成回答时立即触发标题生成，无需等待所有模型完成。

#### Scenario: 单个模型完成时触发
- **WHEN** 聊天启用单个模型
- **AND** 该模型完成首次回答
- **THEN** 系统立即触发标题生成

#### Scenario: 多个模型并行时第一个完成触发
- **WHEN** 聊天启用多个模型并行
- **AND** 第一个模型完成首次回答
- **THEN** 系统立即触发标题生成
- **AND** 不等待其他模型完成

---

### Requirement: 标题生成模型选择
系统必须使用第一个完成回答的模型及其对话历史来生成标题。

#### Scenario: 使用首个完成的模型
- **WHEN** 多个模型并行响应
- **AND** 模型 A 在第 2 秒完成
- **AND** 模型 B 在第 5 秒完成
- **THEN** 系统使用模型 A 及其对话历史生成标题

#### Scenario: 使用模型对话历史
- **WHEN** 触发标题生成
- **THEN** 系统使用选中模型的历史消息（用户消息 + AI 回复）
- **AND** 仅使用最后一条用户消息和最后一条 AI 回复

---

### Requirement: 标题格式要求
系统生成的标题必须符合以下规范：
- 长度：5-10 个汉字
- 风格：简洁、专业、概括主题
- 不包含标点符号
- 直接输出，无冒号前缀

#### Scenario: 标题长度在规定范围内
- **WHEN** AI 生成原始标题
- **THEN** 系统截取或保留前 10 个字符
- **AND** 移除超长部分

#### Scenario: 移除标点符号
- **WHEN** AI 生成包含标点的标题（如 "TypeScript 学习方法。"）
- **THEN** 系统移除所有标点符号
- **AND** 返回 "TypeScript 学习方法"

#### Scenario: 严肃型标题风格
- **WHEN** 对话内容为技术讨论
- **THEN** 生成的标题为专业、概括性描述
- **EXAMPLES**:
  - "如何学习 TypeScript？" → "TypeScript 学习方法"
  - "优化 React 性能" → "React 性能优化"

---

### Requirement: 标题生成失败处理
如果标题生成失败（API 错误、网络超时等），系统必须静默处理，不阻塞用户对话。

#### Scenario: API 调用失败
- **WHEN** 调用生成标题 API 失败
- **THEN** 系统捕获错误
- **AND** 不向用户显示错误提示
- **AND** 聊天标题保持为空
- **AND** 用户可以继续正常对话

#### Scenario: 网络超时
- **WHEN** 标题生成请求超时
- **THEN** 系统取消请求
- **AND** 不影响已完成的 AI 对话内容显示
- **AND** 聊天标题保持为空

---

### Requirement: 用户手动命名优先级
当用户手动设置聊天标题后，该聊天必须永久不再触发自动命名。

#### Scenario: 手动命名后不再触发
- **WHEN** 用户手动设置聊天标题
- **AND** 该聊天后续收到新的 AI 回复
- **THEN** 系统不触发自动标题生成
- **AND** 保持用户手动设置的标题

#### Scenario: 标记手动命名状态
- **WHEN** 用户成功调用 `editChatName` action
- **THEN** 系统设置 `chat.isManuallyNamed = true`
- **AND** 后续检测触发条件时跳过此聊天

---

### Requirement: 禁止空标题命名
系统必须不允许用户将聊天标题设置为空字符串。

#### Scenario: UI 层验证
- **WHEN** 用户在重命名输入框中清空标题
- **AND** 点击确认按钮
- **THEN** 系统显示验证错误
- **AND** 阻止提交空标题

#### Scenario: Redux 层防御
- **WHEN** `editChatName` action 接收到空字符串
- **THEN** 系统 reject 该 action 或保持原标题不变
- **AND** 不触发持久化

---

### Requirement: 全局开关状态管理
系统必须提供全局自动命名开关，默认值为 `true`，并持久化到 localStorage。

#### Scenario: 默认值为打开
- **WHEN** 应用首次启动
- **AND** localStorage 中无 `autoNamingEnabled` 值
- **THEN** 系统设置 `autoNamingEnabled = true`

#### Scenario: 开关状态持久化
- **WHEN** 用户切换全局开关状态
- **THEN** 系统立即保存到 localStorage
- **AND** 键名为 `autoNamingEnabled`

#### Scenario: 开关状态加载
- **WHEN** 应用启动时
- **THEN** 系统从 localStorage 读取 `autoNamingEnabled`
- **AND** 同步到 Redux store

---

### Requirement: 自动命名数据持久化
系统必须将自动生成的标题及其相关状态自动持久化到存储系统。

#### Scenario: 标题生成成功后持久化
- **WHEN** 自动生成标题成功
- **THEN** 系统更新 `chat.name`
- **AND** 触发中间件持久化到 `chats.json`

#### Scenario: 手动命名标记持久化
- **WHEN** 用户手动命名
- **THEN** 系统更新 `chat.isManuallyNamed = true`
- **AND** 触发中间件持久化到 `chats.json`

#### Scenario: 读取已持久化的命名状态
- **WHEN** 应用启动加载聊天列表
- **THEN** 系统从 `chats.json` 恢复所有 `chat.name` 和 `chat.isManuallyNamed`

---

### Requirement: 向后兼容性
系统必须确保新增功能不影响现有聊天数据和手动命名流程。

#### Scenario: 旧数据兼容
- **WHEN** 加载没有新增字段的旧聊天数据
- **THEN** 系统将 `chat.isManuallyNamed` 视为 `undefined` 或 `false`
- **AND** 正常显示和操作聊天

#### Scenario: 手动命名流程不变
- **WHEN** 用户使用原有的手动重命名功能
- **THEN** 功能行为与之前完全一致
- **AND** 额外设置 `isManuallyNamed = true`

---

### Requirement: 多模型并行兼容性
自动标题生成功能必须不干扰多模型并行对话机制。

#### Scenario: 独立异步任务
- **WHEN** 触发标题生成
- **THEN** 系统作为独立异步任务执行
- **AND** 不阻塞其他模型的响应处理

#### Scenario: 不影响模型响应显示
- **WHEN** 标题生成正在执行
- **THEN** 所有模型的对话内容正常显示
- **AND** 用户可以继续交互

---

### Requirement: 标题生成服务接口
系统必须提供统一的标题生成服务接口，使用 `generateText` API。

#### Scenario: 调用标题生成服务
- **WHEN** 需要生成标题
- **THEN** 系统调用 `generateChatTitleService(messages, model)`
- **AND** 传入最后 2 条消息（用户 + 助手）
- **AND** 传入使用的模型配置

#### Scenario: 使用非流式 API
- **WHEN** 标题生成服务内部实现
- **THEN** 使用 `generateText` 而非 `streamText`
- **AND** 等待完整响应后返回

# Reasoning Content Propagation Spec

推理内容传播能力的详细规格说明。

## ADDED Requirements

### Requirement: 在历史消息中包含推理内容
系统 SHALL 在构建发送给模型的历史消息时，根据用户设置的开关状态，将助手的推理内容（`reasoningContent`）包含在消息中。

#### Scenario: 按钮选中时包含推理内容
- **WHEN** 用户选中了"传输推理内容"按钮
- **AND** 历史消息中包含 `role: 'assistant'` 且 `reasoningContent` 非空
- **THEN** 系统将 `reasoningContent` 作为独立的 `reasoning` part 添加到消息的 `content` 数组中
- **AND** 消息格式为：`{ role: 'assistant', content: [{ type: 'text', text: '...' }, { type: 'reasoning', text: '...' }] }`

#### Scenario: 按钮未选中时不包含推理内容
- **WHEN** 用户取消选中"传输推理内容"按钮
- **THEN** 系统不添加任何推理内容到消息中
- **AND** 消息格式保持原始状态

#### Scenario: 不包含推理内容的助手消息
- **WHEN** 历史消息中包含 `role: 'assistant'` 但 `reasoningContent` 为空或未定义
- **THEN** 系统仅发送原始 `content`，不添加任何推理内容标签
- **AND** 消息格式保持不变

#### Scenario: 用户消息不添加推理内容
- **WHEN** 历史消息中包含 `role: 'user'` 或 `role: 'system'`
- **THEN** 系统不检查或添加 `reasoningContent`
- **AND** 消息格式保持不变

### Requirement: 保持消息格式向后兼容
系统 SHALL 确保修改后的消息格式与所有模型供应商（DeepSeek、Moonshot、Zhipu）的 API 兼容，不破坏现有功能。

#### Scenario: DeepSeek 供应商兼容性
- **WHEN** 发送包含推理内容的消息到 DeepSeek API
- **THEN** API 成功处理消息并返回响应
- **AND** 不抛出格式错误或验证错误

#### Scenario: Moonshot 供应商兼容性
- **WHEN** 发送包含推理内容的消息到 Moonshot API
- **THEN** API 成功处理消息并返回响应
- **AND** 不抛出格式错误或验证错误

#### Scenario: Zhipu 供应商兼容性
- **WHEN** 发送包含推理内容的消息到 Zhipu API
- **THEN** API 成功处理消息并返回响应
- **AND** 不抛出格式错误或验证错误

### Requirement: 推理内容格式标准化
系统 SHALL 使用 Vercel AI SDK 的原生 `reasoning` part 类型标记推理内容，确保模型能够正确理解和区分推理与最终回复。

#### Scenario: 使用标准 reasoning part 类型
- **WHEN** 格式化推理内容
- **THEN** 使用 AI SDK 的 `{ type: 'reasoning', text: '...' }` 格式
- **AND** reasoning part 作为 content 数组中的独立元素
- **AND** 推理内容本身保留原始格式（包括换行和缩进）

#### Scenario: 多段推理内容的处理
- **WHEN** 推理内容包含多个段落或结构
- **THEN** 保持内容的原始格式
- **AND** 不对推理内容进行转义或修改

### Requirement: 空推理内容的优雅处理
系统 SHALL 优雅处理各种空值情况（空字符串、null、undefined），避免添加无意义的标签。

#### Scenario: 空字符串推理内容
- **WHEN** `reasoningContent` 为空字符串 `""`
- **THEN** 系统不添加 `<reasoning>` 标签到消息中
- **AND** 消息保持原始格式

#### Scenario: null 或 undefined 推理内容
- **WHEN** `reasoningContent` 为 `null` 或 `undefined`
- **THEN** 系统不添加 `<reasoning>` 标签到消息中
- **AND** 消息保持原始格式

### Requirement: 提供用户控制的切换按钮
系统 SHALL 在聊天界面提供切换按钮控件，允许用户控制是否传输历史推理内容。

#### Scenario: 切换按钮可见性
- **WHEN** 用户在聊天页面
- **THEN** 系统显示"传输推理内容"切换按钮
- **AND** 按钮位置显眼且易于访问
- **AND** 按钮采用描边样式（outline variant），现代扁平化设计
- **AND** 未选中状态：浅灰色边框（`border-gray-300`），中等灰色文字（`text-gray-500`），纯白色背景（`bg-white`）
- **AND** 选中状态：蓝色边框（`border-blue-500`），蓝色文字（`text-blue-500`），浅蓝色背景（`bg-blue-50`）
- **AND** 悬停状态：
  - 未选中时：边框变深（`hover:border-gray-400`），文字变深（`hover:text-gray-700`）
  - 选中时：背景稍深（`hover:bg-blue-100`）

#### Scenario: 切换按钮默认状态
- **WHEN** 用户首次使用应用或清除本地存储后
- **THEN** 按钮默认为未选中状态
- **AND** 不传输历史推理内容

#### Scenario: 切换按钮状态持久化
- **WHEN** 用户点击切换按钮
- **THEN** 系统将新状态保存到本地存储
- **AND** 下次打开应用时恢复上次的状态

#### Scenario: 切换按钮状态实时生效
- **WHEN** 用户点击切换按钮
- **THEN** 系统立即在下一次消息请求中应用新状态
- **AND** 无需刷新页面或重新开始对话

### Requirement: 按钮状态传递到服务层
系统 SHALL 将 UI 按钮状态通过参数传递到聊天服务层，控制消息构建行为。

#### Scenario: 选中状态传递
- **WHEN** 用户选中按钮并发送消息
- **THEN** `streamChatCompletion` 函数接收 `includeReasoningContent: true`
- **AND** `buildMessages` 函数据此添加推理内容

#### Scenario: 未选中状态传递
- **WHEN** 用户取消选中按钮并发送消息
- **THEN** `streamChatCompletion` 函数接收 `includeReasoningContent: false`
- **AND** `buildMessages` 函数据此不添加推理内容

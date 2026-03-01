# 聊天流程集成测试规范

## ADDED Requirements

### Requirement: 完整聊天流程端到端验证
系统必须验证完整的聊天流程，包括用户输入、API 调用、流式响应处理、Redux 状态更新和持久化存储。

**验收标准**:
- 所有模块协作正常，无数据丢失
- Redux 状态正确反映聊天状态
- 持久化存储保存完整的聊天历史
- UI 正确渲染消息内容

#### Scenario: 用户发送消息并接收完整响应
- **WHEN** 用户在聊天界面输入消息并点击发送按钮
- **THEN** 系统必须调用 chatService 发送请求
- **AND** Redux store 必须触发 `sendMessagePending` action
- **AND** UI 必须显示发送中的状态（加载指示器）

#### Scenario: 接收流式响应并更新 UI
- **WHEN** API 返回流式响应
- **THEN** Redux middleware 必须逐块处理响应数据
- **AND** Redux store 必须触发 `addMessageChunk` action
- **AND** UI 必须实时渲染接收到的消息内容
- **AND** 最终 UI 必须显示完整的 assistant 消息

#### Scenario: 聊天历史持久化存储
- **WHEN** 聊天会话完成（用户消息和 assistant 响应都接收完毕）
- **THEN** Redux middleware 必须触发 `saveChats` action
- **AND** chatStorage 必须将聊天数据保存到 IndexedDB（Web 环境）或文件系统（Tauri 环境）
- **AND** 保存的数据必须包含：聊天 ID、标题、模型 ID、所有消息（角色、内容、时间戳）

#### Scenario: 加载历史聊天会话
- **WHEN** 用户刷新页面或重新打开应用
- **THEN** 系统必须从存储中加载聊天历史
- **AND** Redux store 必须触发 `loadChats` action
- **AND** UI 必须渲染历史聊天列表
- **AND** 点击聊天项必须恢复完整的聊天内容

### Requirement: 聊天流程错误处理
系统必须正确处理聊天流程中的各种错误情况，包括 API 错误、网络超时、流式响应中断等。

**验收标准**:
- 所有错误都被捕获并显示给用户
- 错误状态正确保存到 Redux
- 用户能够重试失败的消息发送
- 已接收的消息内容不会因为错误而丢失

#### Scenario: API 返回错误响应
- **WHEN** API 返回 4xx 或 5xx 错误
- **THEN** Redux middleware 必须触发 `sendMessageFailed` action
- **AND** Redux store 必须保存错误信息
- **AND** UI 必须显示错误提示（Toast 或 Alert）
- **AND** 用户输入框必须保持可用，允许重新发送

#### Scenario: 网络超时
- **WHEN** API 请求超时（超过配置的超时时间）
- **THEN** 系统必须取消请求
- **AND** Redux store 必须标记消息为失败状态
- **AND** UI 必须显示超时错误提示
- **AND** 必须提供"重试"按钮

#### Scenario: 流式响应中断
- **WHEN** 流式响应在中途断开（网络问题或服务器错误）
- **THEN** 系统必须保存已接收的消息内容
- **AND** UI 必须显示部分接收的消息
- **AND** 必须标记消息为"不完整"状态
- **AND** 必须提供"重新生成"选项

#### Scenario: 用户取消发送
- **WHEN** 用户在消息发送过程中点击"停止"按钮
- **THEN** 系统必须中止 API 请求
- **AND** Redux store 必须触发 `cancelMessage` action
- **AND** UI 必须停止加载状态
- **AND** 已接收的消息内容必须保留

### Requirement: 推理内容处理
系统必须正确处理模型的推理内容（reasoning content），包括请求和渲染推理过程。

**验收标准**:
- 根据配置决定是否请求推理内容
- 推理内容正确渲染在 UI 中
- 推理内容不包含在最终的消息摘要中
- 推理内容的持久化存储格式正确

#### Scenario: 请求包含推理内容
- **WHEN** 用户开启了"包含推理内容"设置
- **AND** 用户发送消息
- **THEN** chatService 必须在 API 请求中设置 `include_reasoning: true`
- **AND** API 响应必须包含推理内容字段
- **AND** Redux store 必须保存推理内容到消息对象中
- **AND** UI 必须渲染推理内容（可折叠的详情区域）

#### Scenario: 不请求推理内容
- **WHEN** 用户关闭了"包含推理内容"设置
- **AND** 用户发送消息
- **THEN** chatService 必须在 API 请求中设置 `include_reasoning: false`
- **AND** API 响应不应包含推理内容
- **AND** UI 必须不显示推理内容区域

#### Scenario: 推理内容的持久化存储
- **WHEN** 聊天会话包含推理内容
- **THEN** 持久化存储必须保存推理内容
- **AND** 存储格式必须符合 `StandardMessage` 类型定义（reasoning 字段）
- **AND** 加载历史聊天时必须正确恢复推理内容

### Requirement: 多轮对话上下文管理
系统必须在多轮对话中维护上下文，确保 API 请求包含完整的对话历史。

**验收标准**:
- 每次请求包含当前聊天会话的所有历史消息
- 消息顺序必须保持正确
- 上下文长度限制必须正确处理（如果有限制）

#### Scenario: 发送第一条消息
- **WHEN** 用户在新的聊天会话中发送第一条消息
- **THEN** API 请求必须仅包含当前用户消息
- **AND** 消息列表必须格式化为 API 期望的格式

#### Scenario: 发送后续消息
- **WHEN** 用户在已有对话历史的会话中发送新消息
- **THEN** API 请求必须包含完整的对话历史（所有之前的消息）
- **AND** 消息顺序必须是：最早的在前，最新的在后
- **AND** 最后一条消息必须是当前用户输入

#### Scenario: 消息格式转换
- **WHEN** Redux store 中的消息格式为 `StandardMessage`
- **THEN** chatService 必须将其转换为 API 期望的格式
- **AND** 转换必须保留所有必要字段（role、content、reasoning 等）
- **AND** 转换后的格式必须符合 Vercel AI SDK 标准

### Requirement: 聊天会话管理
系统必须正确管理聊天会话的生命周期，包括创建、切换、删除会话。

**验收标准**:
- 创建新会话时初始化空的消息列表
- 切换会话时正确加载对应的消息历史
- 删除会话时清理所有相关数据

#### Scenario: 创建新聊天会话
- **WHEN** 用户点击"新建聊天"按钮
- **THEN** Redux store 必须触发 `createChat` action
- **AND** 新会话必须生成唯一的 ID
- **AND** 新会话的消息列表必须初始化为空数组
- **AND** UI 必须切换到新会话的聊天界面

#### Scenario: 切换聊天会话
- **WHEN** 用户从聊天列表中选择一个历史会话
- **THEN** Redux store 必须触发 `selectChat` action
- **AND** Redux store 必须更新 `selectedChatId` 为选中的会话 ID
- **AND** UI 必须渲染选中会话的消息历史
- **AND** URL 必须更新为 `/chat/:chatId`

#### Scenario: 删除聊天会话
- **WHEN** 用户删除一个聊天会话
- **THEN** Redux store 必须触发 `deleteChat` action
- **AND** 持久化存储必须删除该会话的数据
- **AND** 如果删除的是当前会话，UI 必须切换到其他会话或创建新会话
- **AND** 聊天列表必须更新，移除已删除的会话

### Requirement: 聊天性能优化
系统必须确保聊天流程的性能符合用户体验要求，包括响应速度、内存使用等。

**验收标准**:
- 消息发送响应时间 < 100ms（不包括 API 等待时间）
- 流式响应渲染延迟 < 50ms（每块数据）
- 大量消息的聊天历史加载时间 < 1s

#### Scenario: 快速发送消息
- **WHEN** 用户快速连续发送多条消息
- **THEN** 系统必须正确处理消息队列
- **AND** UI 必须按顺序显示消息
- **AND** 不得出现消息丢失或乱序

#### Scenario: 渲染大量消息
- **WHEN** 聊天会话包含超过 100 条消息
- **THEN** UI 必须使用虚拟化或分页渲染
- **AND** 首屏渲染时间必须 < 1s
- **AND** 滚动必须流畅（60fps）

#### Scenario: 流式响应实时渲染
- **WHEN** API 返回流式响应
- **THEN** UI 必须在接收到每个数据块后 50ms 内更新
- **AND** 不得阻塞主线程
- **AND** 滚动条必须自动跟随最新消息

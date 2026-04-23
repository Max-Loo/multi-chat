# Spec: Chat Panel Testing

本规格定义了聊天面板相关组件的测试要求，确保聊天界面的正确性和用户体验。

## Purpose

确保聊天面板组件（ChatPanel、ChatPanelContent、ChatPanelSender、ChatBubble、RunningChatBubble、DetailTitle、ChatPanelHeader 等）具有完整的单元测试覆盖，验证组件渲染、用户交互、流式消息处理和边界情况的正确性。

## Requirements

### Requirement: ChatPanel 组件渲染
系统 SHALL 能够正确渲染 ChatPanel 组件，并根据聊天模型列表动态生成聊天面板布局。测试 SHALL 使用语义化查询定位元素，SHALL NOT 使用条件守卫静默跳过断言。

#### Scenario: 单模型聊天面板渲染
- **WHEN** 选中的聊天包含 1 个模型
- **THEN** 系统应显示单个聊天面板
- **AND** 面板应包含头部、内容区域和发送框

#### Scenario: 多模型聊天面板网格布局
- **WHEN** 选中的聊天包含 3 个模型
- **THEN** 系统应按网格布局显示 3 个聊天面板
- **AND** 面板应按照 columnCount 参数排列

#### Scenario: 可调整大小的面板布局
- **WHEN** 用户启用 isSplitter 模式且聊天包含多个模型
- **THEN** 系统应显示可拖动调整大小的面板
- **AND** 面板应支持水平和垂直方向调整

#### Scenario: 分割模式下显示不同布局
- **WHEN** 启用分割模式
- **THEN** 测试 SHALL 使用 `getByRole('switch')` 定位开关并断言其存在
- **AND** MUST NOT 使用 `if (splitterSwitch)` 守卫包裹交互逻辑

#### Scenario: 切换聊天时重置分割模式
- **WHEN** 在分割模式下切换到不同聊天
- **THEN** 测试 SHALL 先用 `expect(element).toBeInTheDocument()` 确认开关存在
- **AND** 再执行点击交互，MUST NOT 使用条件守卫静默跳过

---

### Requirement: ChatPanelContent 组件布局
系统 SHALL 能够将聊天模型列表转换为二维网格布局，并正确渲染每个模型的面板内容。

#### Scenario: 列表转二维网格
- **WHEN** 聊天模型列表包含 5 个模型且 columnCount 为 2
- **THEN** 系统应生成 3 行布局（2+2+1）
- **AND** 每个单元格应包含对应的 ChatPanelContentDetail

#### Scenario: 空列表处理
- **WHEN** 聊天模型列表为空
- **THEN** 系统应渲染空面板容器
- **AND** 不应显示任何聊天内容

---

### Requirement: ChatPanelSender 消息发送
系统 SHALL 提供消息输入和发送功能，支持文本输入、Enter 发送、Shift+Enter 换行，以及发送中断。

#### Scenario: 基础消息发送
- **WHEN** 用户在输入框输入文本并点击发送按钮
- **THEN** 系统应调用 startSendChatMessage action
- **AND** 应清空输入框
- **AND** 应保存 AbortController 用于中断

#### Scenario: Enter 键发送消息
- **WHEN** 用户按下 Enter 键（未按 Shift）
- **AND** 输入框不为空
- **THEN** 系统应发送消息
- **AND** 应阻止默认换行行为

#### Scenario: Shift+Enter 换行
- **WHEN** 用户按下 Shift+Enter 组合键
- **THEN** 系统应在输入框中换行
- **AND** 不应触发消息发送

#### Scenario: 发送中忽略 Enter 键
- **WHEN** 消息正在发送中（isSending=true）
- **AND** 用户按下 Enter 键
- **THEN** 系统应忽略该事件
- **AND** 不应重复发送消息

#### Scenario: 中止消息发送
- **WHEN** 用户在发送过程中点击停止按钮
- **THEN** 系统应调用 abortController.abort()
- **AND** 应清除保存的 AbortController 引用

#### Scenario: 空消息不发送
- **WHEN** 用户尝试发送空字符串或仅包含空格的消息
- **THEN** 系统应不执行任何操作
- **AND** 不应调用 startSendChatMessage action

---

### Requirement: 发送失败时保持输入框内容
系统 SHALL 在消息发送失败时保留输入框中的文本内容，MUST NOT 清空输入框。

#### Scenario: 发送失败保留输入
- **WHEN** 用户在输入框输入文本并点击发送按钮
- **AND** `startSendChatMessage` action 以 rejected 状态完成
- **THEN** 输入框 SHALL 保留用户输入的文本
- **AND** MUST NOT 清空输入框内容

---

### Requirement: macOS Safari 中文输入法兼容性
系统 SHALL 正确处理 macOS Safari 浏览器的中文输入法 Enter 键 bug。

#### Scenario: Safari 中文输入法 Enter 键保护
- **WHEN** 浏览器为 macOS Safari
- **AND** 用户在中文输入法下完成输入（compositionEnd 事件触发）
- **AND** 在 100ms 内按下 Enter 键
- **THEN** 系统应阻止消息发送
- **AND** 应避免误触发送

#### Scenario: 非 Safari 环境 Enter 键正常工作
- **WHEN** 浏览器不是 macOS Safari
- **AND** 用户按下 Enter 键
- **THEN** 系统应正常发送消息
- **AND** 不应应用 Safari 特殊处理

---

### Requirement: 推理内容开关
系统 SHALL 提供推理内容传输开关，允许用户选择是否在历史消息中传输推理内容。

#### Scenario: 显示推理内容开关（临时隐藏）
- **WHEN** 用户查看 ChatPanelSender
- **THEN** 系统应隐藏推理内容开关（当前实现）
- **AND** 开关应包含 CSS class "hidden"

#### Scenario: 切换推理内容开关
- **WHEN** 用户点击推理内容开关按钮
- **THEN** 系统应调用 setIncludeReasoningContent action
- **AND** 应切换开关的视觉状态（边框颜色、背景色）

---

### Requirement: ChatBubble 消息气泡渲染
系统 SHALL 能够渲染用户和助手的消息气泡，包含文本内容和可选的推理内容。

#### Scenario: 用户消息气泡
- **WHEN** 消息角色为 "user"
- **THEN** 系统应渲染用户样式的消息气泡
- **AND** 应显示消息文本内容
- **AND** 应显示消息时间戳

#### Scenario: 助手消息气泡
- **WHEN** 消息角色为 "assistant"
- **THEN** 系统应渲染助手样式的消息气泡
- **AND** 应显示消息文本内容
- **AND** 可选：显示推理内容折叠面板

#### Scenario: 包含推理内容的消息
- **WHEN** 消息包含 reasoningContent 字段
- **THEN** 系统应显示可折叠的推理内容区域
- **AND** 用户可以展开/收起推理内容

---

### Requirement: RunningChatBubble 运行中消息
系统 SHALL 能够渲染正在生成的消息，显示加载动画和流式内容更新。

#### Scenario: 显示加载动画
- **WHEN** 消息正在生成中（isSending=true）
- **THEN** 系统应显示加载动画（骨架屏或旋转图标）
- **AND** 应显示"正在生成..."提示文本

#### Scenario: 流式内容更新
- **WHEN** 接收到流式消息内容增量
- **THEN** 系统应实时更新消息气泡内容
- **AND** 应保持输入框可用（允许中止）

---

### Requirement: DetailTitle 模型详情标题
系统 SHALL 能够显示模型配置的详细信息，包括模型名称、提供商和 API 地址。

#### Scenario: 显示模型名称
- **WHEN** ChatModel 配置包含 modelName 字段
- **THEN** 系统应在标题区域显示模型名称

#### Scenario: 显示提供商信息
- **WHEN** ChatModel 配置包含 providerKey 字段
- **THEN** 系统应显示对应的提供商名称（如 DeepSeek、Kimi）

---

### Requirement: ChatPanelHeader 面板头部控制
系统 SHALL 提供聊天面板的头部控制功能，包括列数调整和分割模式切换。

#### Scenario: 调整列数
- **WHEN** 用户修改 columnCount 参数
- **THEN** 系统应重新计算面板布局
- **AND** 应按新的列数显示聊天面板

#### Scenario: 切换分割模式
- **WHEN** 用户点击分割模式切换按钮
- **THEN** 系统应启用/禁用可调整大小的面板布局
- **AND** 应在切换分割模式时重置布局状态

#### Scenario: 聊天模型变化时重置分割模式
- **WHEN** 选中的聊天模型列表发生变化
- **THEN** 系统应自动退出分割模式
- **AND** 应恢复为默认网格布局

---

### Requirement: Grid 组件测试覆盖

Grid 组件的测试 SHALL 验证以下行为：

- 根据 board 数据渲染正确行列数的面板
- 应用正确的边框样式（右侧边框、底部边框）

#### Scenario: 多行多列渲染

- **WHEN** board 为 2 行 3 列的 ChatModel 数组
- **THEN** SHALL 渲染 2 行，每行 3 个 Detail 组件，并应用正确的边框样式

---

### Requirement: Splitter 组件测试覆盖

Splitter 组件的测试 SHALL 验证以下行为：

- 渲染正确数量的 ResizablePanel 和 ResizableHandle
- 根据 board 数据计算 defaultSize

#### Scenario: 面板尺寸分配

- **WHEN** board 为 2 行 2 列
- **THEN** 每行 defaultSize SHALL 为 50，每列 defaultSize SHALL 为 50

---

### Requirement: PanelSkeleton 组件测试覆盖

PanelSkeleton 组件的测试 SHALL 验证以下行为：

- 渲染 Header 骨架
- 根据 columnCount 渲染对应数量的列
- 骨架消息气泡交替对齐

#### Scenario: 多列骨架渲染

- **WHEN** columnCount=2
- **THEN** SHALL 渲染 2 列骨架面板

---

### Requirement: Detail 滚动行为测试补充

Detail 组件的测试 SHALL 补充验证以下现有测试未覆盖的行为：

- 内容超出容器时显示"滚动到底部"按钮
- 滚动到底部后隐藏该按钮
- ResizeObserver 触发滚动状态重新检测

#### Scenario: 滚动到底部按钮显示

- **WHEN** 内容超出容器高度且用户向上滚动
- **THEN** SHALL 显示"滚动到底部"按钮

#### Scenario: 滚动到底部后按钮隐藏

- **WHEN** 用户点击"滚动到底部"按钮
- **THEN** SHALL 滚动到底部并隐藏该按钮

---

### Requirement: RunningBubble 组件测试覆盖

RunningBubble 组件的测试 SHALL 验证以下行为：

- 未发送时返回空内容
- 无 chatData 时返回空内容
- 历史为空时显示 spinner
- 有内容时渲染 ChatBubble

#### Scenario: 非发送状态

- **WHEN** isSending 为 false
- **THEN** SHALL 不渲染任何可见内容

#### Scenario: 有运行内容

- **WHEN** isSending 为 true 且有运行内容
- **THEN** SHALL 渲染 ChatBubble 组件

#### Scenario: 等待首字

- **WHEN** isSending 为 true 但历史为空
- **THEN** SHALL 显示 spinner 加载指示器

---

### Requirement: Title 组件测试覆盖

Title 组件的测试 SHALL 验证以下行为：

- 从 Redux store 查找模型信息
- 模型不存在时显示 destructive 状态
- 显示昵称+模型名称（格式：`nickname (modelName)`）
- 已删除/已禁用模型显示对应状态 Badge
- Tooltip 显示完整模型信息

#### Scenario: 模型存在且有昵称

- **WHEN** 模型存在于 store 且有 nickname
- **THEN** SHALL 显示 "nickname (modelName)" 格式

#### Scenario: 模型不存在

- **WHEN** 模型 ID 在 store 中找不到
- **THEN** SHALL 显示 destructive 颜色的 Badge

#### Scenario: 已禁用模型

- **WHEN** 模型存在但 status 为 disabled
- **THEN** SHALL 显示 secondary 颜色的 Badge

---

### Requirement: 异步状态更新的断言必须使用 await

ChatPanel 测试中所有使用 `waitFor()` 的场景 SHALL 在调用前添加 `await`，确保异步断言能够正确执行。未 `await` 的 `waitFor` 调用 SHALL 视为测试缺陷。

#### Scenario: waitFor 异步断言正确执行
- **WHEN** 测试代码使用 `waitFor()` 等待状态更新并执行断言
- **THEN** 必须在 `waitFor()` 前添加 `await`，确保断言在 Promise resolve 后执行

#### Scenario: 未 await 的 waitFor 被修复
- **WHEN** ChatPanel.test.tsx 中第 157 行和第 333 行的 `waitFor()` 调用
- **THEN** 这两处 SHALL 添加 `await` 关键字，使内部断言能够执行

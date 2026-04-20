## ADDED Requirements

### Requirement: 消息列表虚拟化渲染
聊天消息列表 SHALL 使用 virtua 的 Virtualizer 组件对历史消息（ChatBubble）进行虚拟化渲染，只创建可视区域及缓冲区内的 ChatBubble DOM 节点。Title 头部、RunningBubble、错误 Alert 保持在 Virtualizer 外部，不参与虚拟化。

#### Scenario: 打开包含 50 条消息的对话
- **WHEN** 用户打开一个包含 50 条历史消息的对话
- **THEN** 系统 SHALL 只创建可视区域内（约 5-10 条）消息的 ChatBubble DOM 节点，加上上下缓冲区内的少量节点

#### Scenario: 滚动消息列表
- **WHEN** 用户在消息列表中上下滚动
- **THEN** 系统 SHALL 动态创建进入可视区域的 ChatBubble 节点，并回收离开可视区域的 ChatBubble 节点

#### Scenario: 多面板模式下的消息渲染
- **WHEN** 用户在多面板模式下查看 3 个面板
- **THEN** 每个面板 SHALL 独立进行虚拟化渲染，只渲染各自可视区域内的消息

#### Scenario: Title 头部不被虚拟化回收
- **WHEN** 用户在消息列表中向上滚动
- **THEN** Title 组件 SHALL 始终保持在 DOM 中（不被虚拟化引擎回收）

#### Scenario: RunningBubble 不参与虚拟化
- **WHEN** AI 正在流式生成消息
- **THEN** RunningBubble SHALL 始终渲染在 Virtualizer 外部，高度变化不触发虚拟化引擎重新测量

### Requirement: 消息列表自动滚到底部
消息列表 SHALL 在新消息到来时自动滚动到底部，保持现有的"自动跟随"行为。使用 `shouldStickToBottom` ref 跟踪用户滚动位置，流式更新时据此决定是否自动跟随。

#### Scenario: 流式生成新消息时自动跟随
- **WHEN** AI 正在流式生成消息且用户已在底部位置（shouldStickToBottom 为 true）
- **THEN** 系统 SHALL 自动滚动到底部以展示最新内容

#### Scenario: 用户向上滚动时不强制跟随
- **WHEN** 用户已向上滚动离开底部位置（shouldStickToBottom 为 false）
- **THEN** 系统 SHALL NOT 强制滚动到底部，而是显示"回到底部"按钮

#### Scenario: 点击回到底部按钮
- **WHEN** 用户点击"回到底部"按钮
- **THEN** 系统 SHALL 滚动到消息列表底部并展示最新消息

### Requirement: 滚动条自适应显示
消息列表和对话列表 SHALL 保持现有的滚动条自适应行为：滚动时显示细滚动条，停止后隐藏。

#### Scenario: 滚动时显示滚动条
- **WHEN** 用户在消息列表或对话列表中滚动
- **THEN** 系统 SHALL 显示细滚动条样式

#### Scenario: 停止滚动后隐藏滚动条
- **WHEN** 用户停止滚动超过 500ms
- **THEN** 系统 SHALL 隐藏滚动条

### Requirement: 对话列表虚拟化渲染
侧边栏对话列表 SHALL 使用 virtua 的 VList 组件进行虚拟化渲染。

#### Scenario: 大量对话时的滚动性能
- **WHEN** 用户有 100+ 条对话并在侧边栏滚动
- **THEN** 系统 SHALL 只渲染可视区域内的 ChatButton，保持流畅滚动

#### Scenario: 搜索过滤后的虚拟化
- **WHEN** 用户在搜索框输入文本过滤对话
- **THEN** 过滤后的列表 SHALL 同样使用虚拟化渲染

### Requirement: ChatBubble 组件 memo 优化
ChatBubble 组件 SHALL 使用 React.memo 包裹，避免父组件重渲染时不必要的级联渲染。

#### Scenario: 流式更新时不重渲染历史消息
- **WHEN** AI 正在流式生成新消息（runningChatData 每隔约 50ms 更新）
- **THEN** 历史消息的 ChatBubble SHALL NOT 重新渲染

#### Scenario: 消息内容变化时正确重渲染
- **WHEN** 消息的 content 或 reasoningContent 属性发生变化
- **THEN** 对应的 ChatBubble SHALL 重新渲染

### Requirement: RunningBubble selector 粒度收窄
RunningBubble 组件 SHALL 只订阅当前面板所需的 runningChat 数据（精确到 chatId + modelId），而非整个 runningChat 对象。

#### Scenario: 多面板下其他面板的流式更新
- **WHEN** 面板 A 正在流式生成消息，面板 B 和 C 处于空闲状态
- **THEN** 面板 B 和 C 的 RunningBubble SHALL NOT 因面板 A 的数据更新而重渲染

#### Scenario: 当前面板的流式数据更新
- **WHEN** 当前面板的 runningChat 数据更新
- **THEN** 当前面板的 RunningBubble SHALL 正确渲染流式内容

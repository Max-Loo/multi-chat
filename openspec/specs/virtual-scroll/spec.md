## 能力：virtual-scroll

虚拟滚动核心能力，负责消息列表和对话列表的虚拟化渲染及滚动行为管理。

### REQUIREMENTS

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
消息列表 SHALL 在新消息到来时自动滚动到底部，保持现有的"自动跟随"行为。使用 `isAtBottom` state（配合 `isAtBottomRef` 镜像）跟踪用户滚动位置，流式更新时据此决定是否自动跟随。`scrollToBottom` 回调 SHALL 保持引用稳定（依赖数组为空），通过 `historyLengthRef` 读取最新的消息列表长度，避免流式 effect 因回调引用变化而频繁 teardown/setup。`isAtBottomRef` 供流式自动跟随 effect 读取，避免 effect 依赖中包含 state。

#### Scenario: 流式生成新消息时自动跟随
- **WHEN** AI 正在流式生成消息且用户已在底部位置（isAtBottom 为 true）
- **THEN** 系统 SHALL 自动滚动到底部以展示最新内容，且 scrollToBottom 回调引用在整个流式过程中保持不变

#### Scenario: 流式 effect 不因回调重建而频繁触发
- **WHEN** AI 正在流式生成消息，runningChatData 持续更新
- **THEN** 流式自动跟随 effect SHALL NOT 因 scrollToBottom 回调重建而执行 cleanup/setup 循环

#### Scenario: 用户向上滚动时不强制跟随
- **WHEN** 用户已向上滚动离开底部位置（isAtBottom 为 false）
- **THEN** 系统 SHALL NOT 强制滚动到底部，而是显示"回到底部"按钮

#### Scenario: 点击回到底部按钮
- **WHEN** 用户点击"回到底部"按钮
- **THEN** 系统 SHALL 滚动到消息列表底部并展示最新消息

### Requirement: 滚动条自适应显示
消息列表和对话列表 SHALL 保持现有的滚动条自适应行为：滚动时显示细滚动条，停止后隐藏。滚动状态更新（`needsScrollbar`、`isAtBottom`）SHALL 在值未发生变化时跳过 React 协调，使用 functional updater 模式进行变更检测。`checkScrollStatus` 禁止使用 requestAnimationFrame 嵌套和防递归标志，改用 functional updater 天然防重。

#### Scenario: 滚动时显示滚动条
- **WHEN** 用户在消息列表或对话列表中滚动
- **THEN** 系统 SHALL 显示细滚动条样式

#### Scenario: 停止滚动后隐藏滚动条
- **WHEN** 用户停止滚动超过 500ms
- **THEN** 系统 SHALL 隐藏滚动条

#### Scenario: 滚动位置未变化时不触发协调
- **WHEN** 用户在底部位置轻微滚动或触摸板误触发微幅滚动
- **THEN** 系统 SHALL NOT 因 needsScrollbar 或 isAtBottom 值未变而触发无意义的 React 重渲染

### Requirement: ResizeObserver 生命周期管理
ResizeObserver effect 必须与内容变化 effect 拆分为两个独立 effect，ResizeObserver 的依赖为 `[]`（挂载时创建一次，不随内容数据变化而重建）。

#### Scenario: ResizeObserver 不随消息变化重建
- **WHEN** 消息列表内容发生变化（新增消息、流式更新）
- **THEN** ResizeObserver SHALL NOT 被断开并重新创建

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

### Requirement: Sidebar 过滤器 predicate 稳定化
Sidebar 的 `useDebouncedFilter` predicate SHALL 用 `useCallback` 包裹，依赖 `filterText`，避免每次渲染创建新的 predicate 函数引用。

#### Scenario: 过滤器 predicate 引用稳定
- **WHEN** filterText 未变化时 Sidebar 重渲染
- **THEN** useDebouncedFilter 的 predicate SHALL 保持相同引用，不触发重新过滤

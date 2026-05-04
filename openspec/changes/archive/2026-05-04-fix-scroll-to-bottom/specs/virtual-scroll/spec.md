## MODIFIED Requirements

### Requirement: 消息列表虚拟化渲染
聊天消息列表 SHALL 使用 virtua 的 Virtualizer 组件对历史消息和流式消息进行统一的虚拟化渲染，只创建可视区域及缓冲区内的 ChatBubble DOM 节点。流式消息 SHALL 作为 Virtualizer 内部的最后一项动态加入合并列表 `displayList`，而非独立渲染在 Virtualizer 外部。Title 头部和错误 Alert 保持在 Virtualizer 外部，不参与虚拟化。流式消息尚未有内容时的 loading spinner 保留在 Virtualizer 外部。

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

#### Scenario: 流式消息参与虚拟化渲染
- **WHEN** AI 正在流式生成消息且有内容产出
- **THEN** 流式消息 SHALL 作为 Virtualizer 内部的最后一项渲染，使用与历史消息相同的 ChatBubble 组件（`isRunning={true}`）

#### Scenario: 流式消息未产出内容时显示 loading spinner
- **WHEN** AI 正在流式生成消息但尚未产出内容（content 和 reasoningContent 均为空）
- **THEN** 系统 SHALL 在 Virtualizer 外部展示 loading spinner

#### Scenario: 流式结束到历史的过渡无闪烁
- **WHEN** 流式消息生成完成，Redux 将数据从 runningChat 移至 chatHistoryList
- **THEN** 过渡 SHALL 在单个 Immer transaction 中完成，由于 key（id）相同，React 复用同一组件实例，视觉无跳变

### Requirement: 消息列表自动滚到底部
消息列表 SHALL 在新消息到来时自动滚动到底部，保持现有的"自动跟随"行为。使用 `isAtBottom` state（配合 `isAtBottomRef` 镜像）跟踪用户滚动位置，流式更新时据此决定是否自动跟随。`scrollToBottom` 回调 SHALL 保持引用稳定（依赖数组为空），通过 `displayLengthRef` 读取合并列表（含流式消息）的最新长度，避免流式 effect 因回调引用变化而频繁 teardown/setup。`isAtBottomRef` 供流式自动跟随 effect 读取，避免 effect 依赖中包含 state。

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
- **THEN** 系统 SHALL 滚动到合并列表（含流式消息）的底部并展示最新消息

### Requirement: RunningBubble selector 粒度收窄

~~RunningBubble 组件 SHALL 只订阅当前面板所需的 runningChat 数据（精确到 chatId + modelId），而非整个 runningChat 对象。~~

此需求已被合并到 Detail 组件中。Detail 组件 SHALL 通过精确到 `chatId + modelId` 的 `runningChatData` selector 获取流式数据，用于构造合并列表。独立的 RunningBubble 组件已被删除。

#### Scenario: 多面板下其他面板的流式更新
- **WHEN** 面板 A 正在流式生成消息，面板 B 和 C 处于空闲状态
- **THEN** 面板 B 和 C SHALL NOT 因面板 A 的数据更新而重渲染

#### Scenario: 当前面板的流式数据更新
- **WHEN** 当前面板的 runningChat 数据更新
- **THEN** 合并列表 SHALL 正确反映最新流式内容，仅最后一项 ChatBubble 重渲染

## REMOVED Requirements

### Requirement: RunningBubble 不参与虚拟化
**Reason**: RunningBubble 已被删除，流式消息现在作为 Virtualizer 内部最后一项渲染，统一管理所有消息的滚动行为。
**Migration**: 使用合并列表 `displayList` 将流式消息动态添加为 Virtualizer 最后一项。

## ADDED Requirements

### Requirement: 根据运行状态决定渲染内容

RunningBubble SHALL 根据运行数据的状态返回不同的渲染结果。

#### Scenario: 没有运行数据时返回 null
- **WHEN** selector 返回 undefined 或 null
- **THEN** 组件返回 null

#### Scenario: isSending 为 false 时返回 null
- **WHEN** 运行数据存在但 isSending 为 false
- **THEN** 组件返回 null

#### Scenario: 流式刚开始且无内容时显示 Spinner
- **WHEN** isSending 为 true 且 history 为空或 content 和 reasoningContent 都为空
- **THEN** 渲染 Spinner 加载指示器

#### Scenario: 有流式内容时渲染 ChatBubble
- **WHEN** isSending 为 true 且 history.content 或 history.reasoningContent 有值
- **THEN** 渲染 ChatBubble 组件，传入 isRunning=true

### Requirement: Selector 精确订阅

RunningBubble 通过 `useAppSelector` 精确订阅 `state.chat.runningChat[selectedChatId][modelId]` 的数据，避免其他面板的流式更新触发重渲染。此行为通过代码审查验证，不纳入单元测试范围（单元测试难以可靠验证 selector 订阅粒度）。

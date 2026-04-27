# streaming-render-perf-tests

## Purpose

验证流式渲染场景下 ChatBubble、ThinkingSection 和 RunningBubble 组件的计算调用次数精确性与渲染隔离性，确保 useMemo 依赖正确、Redux selector 精准订阅。

## Requirements

### Requirement: ChatBubble 流式更新时 generateCleanHtml 调用次数追踪
系统 SHALL 在 ChatBubble 组件中，当 content props 连续变化（模拟流式 SSE chunk）时，`generateCleanHtml` 的调用次数 SHALL 等于 content 变化次数。相同 content 的重复渲染 SHALL NOT 触发额外调用。

#### Scenario: content 逐次增长时每次触发调用
- **WHEN** ChatBubble 以 content="H" 渲染，然后依次 rerender 为 content="He"、"Hel"、"Hell"、"Hello"
- **THEN** `generateCleanHtml` 总共被调用 5 次（每次 content 变化触发 useMemo 重计算）

#### Scenario: 相同 content 的 rerender 不触发额外调用
- **WHEN** ChatBubble 以 content="Hello" 渲染，然后以相同 content="Hello" rerender（其他 props 如 isRunning 变化）
- **THEN** `generateCleanHtml` 仅被调用 1 次（初始渲染），后续 rerender 因 useMemo 依赖未变而跳过

#### Scenario: 多个 ChatBubble 独立计算
- **WHEN** 同时渲染 3 个 ChatBubble（content 分别为 "A"、"B"、"C"），然后仅更新第 2 个的 content 为 "B2"
- **THEN** `generateCleanHtml` 总共被调用 4 次（初始 3 次 + 第 2 个更新 1 次），其余 2 个不触发额外调用

### Requirement: ThinkingSection 推理内容更新时 generateCleanHtml 调用次数追踪
系统 SHALL 在 ThinkingSection 组件中，当 content props 变化时，`generateCleanHtml` 的调用次数 SHALL 等于 content 变化次数。

#### Scenario: 推理内容逐步增长
- **WHEN** ThinkingSection 以 content="Step 1" 渲染，然后依次更新为 "Step 1\nStep 2"、"Step 1\nStep 2\nStep 3"
- **THEN** `generateCleanHtml` 总共被调用 3 次（每次 content 变化触发）

#### Scenario: content 不变时 title 或 loading 变化不触发调用
- **WHEN** ThinkingSection 以 content="推理完成" 渲染，然后更新 title 从 "思考中" 变为 "思考完毕"、loading 从 true 变为 false
- **THEN** `generateCleanHtml` 仅被调用 1 次（初始渲染）

### Requirement: RunningBubble 在 Redux state 持续更新时的渲染隔离
系统 SHALL 确保 RunningBubble 仅在当前面板的 runningChat 数据变化时重渲染，其他面板或无关 state 变化 SHALL NOT 触发重渲染。

#### Scenario: 当前面板流式更新时渲染
- **WHEN** RunningBubble 渲染后，通过 dispatch 更新当前 chatId + modelId 对应的 runningChat.history.content（从 "H" 到 "He" 到 "Hel"）
- **THEN** 渲染追踪器记录重渲染次数等于 dispatch 次数 + 1（初始渲染）

#### Scenario: 其他面板的 runningChat 更新时不渲染
- **WHEN** RunningBubble 渲染后，通过 dispatch 更新另一个 chatId 的 runningChat 数据
- **THEN** 渲染追踪器仅记录 1 次（初始渲染），不因其他面板数据变化而重渲染

#### Scenario: 其他模型的 runningChat 更新时不渲染
- **WHEN** RunningBubble 渲染后，通过 dispatch 更新同一 chatId 下另一个 modelId 的 runningChat 数据
- **THEN** 渲染追踪器仅记录 1 次（初始渲染）

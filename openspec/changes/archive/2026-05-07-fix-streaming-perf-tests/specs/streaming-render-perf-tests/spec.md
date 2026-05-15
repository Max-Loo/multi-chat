## MODIFIED Requirements

### Requirement: ChatBubble 流式更新时 generateCleanHtml 调用次数追踪
系统 SHALL 在 ChatBubble 组件中，当 content props 连续变化（模拟流式 SSE chunk）时，`generateCleanHtml` 的调用次数 SHALL 等于 content 变化次数。当 `isRunning` 从 true 变为 false 时，`generateCleanHtml` SHALL 被调用 1 次以执行流式结束后的完整渲染（useMemo 依赖 `[content, isRunning]`）。

#### Scenario: content 逐次增长时每次触发调用
- **WHEN** ChatBubble 以 content="H" 渲染，然后依次 rerender 为 content="He"、"Hel"、"Hell"、"Hello"
- **THEN** `generateCleanHtml` 总共被调用 5 次（每次 content 变化触发 useMemo 重计算）

#### Scenario: 相同 content 的 rerender 不触发额外调用
- **WHEN** ChatBubble 以 content="Hello"、isRunning=true 渲染，然后以相同 content="Hello"、isRunning=false rerender
- **THEN** `generateCleanHtml` 在 rerender 中被调用 1 次（因 isRunning 从 true→false 触发 fullHtml useMemo 重算，执行流式结束后的完整渲染）

#### Scenario: 多个 ChatBubble 独立计算
- **WHEN** 同时渲染 3 个 ChatBubble（content 分别为 "A"、"B"、"C"），然后仅更新第 2 个的 content 为 "B2"
- **THEN** `generateCleanHtml` 总共被调用 4 次（初始 3 次 + 第 2 个更新 1 次），其余 2 个不触发额外调用

### Requirement: ThinkingSection 推理内容更新时 generateCleanHtml 调用次数追踪
系统 SHALL 在 ThinkingSection 组件展开状态下（`initiallyExpanded={true}`），当 content props 变化时，`generateCleanHtml` 的调用次数 SHALL 等于 content 变化次数。

#### Scenario: 推理内容逐步增长
- **WHEN** ThinkingSection 以 initiallyExpanded=true、content="Step 1" 渲染，然后依次更新为 "Step 1\nStep 2"、"Step 1\nStep 2\nStep 3"
- **THEN** `generateCleanHtml` 总共被调用 3 次（每次 content 变化触发）

#### Scenario: content 不变时 title 或 loading 变化的调用行为
- **WHEN** ThinkingSection 以 initiallyExpanded=true、content="推理完成" 渲染，然后更新 title 从 "思考中" 变为 "思考完毕"、loading 从 true 变为 false
- **THEN** `generateCleanHtml` 在初始渲染时被调用 1 次；title 变化后因 React Compiler 自动 memo 化（StreamingContent props 未变）不触发额外调用；loading 变化后因 fullHtml useMemo 依赖 isRunning 变化触发 1 次额外调用；rerender 合计 1 次

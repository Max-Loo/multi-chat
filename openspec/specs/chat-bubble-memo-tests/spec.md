## ADDED Requirements

### Requirement: memo 重渲染行为正确性

`ChatBubble` 组件使用 `React.memo` + 自定义 `arePropsEqual` 比较函数，只比较 `role`、`content`、`reasoningContent`、`isRunning` 四个 props。测试通过渲染次数追踪 + 组合策略间接验证 memo 行为。

> 注：`arePropsEqual` 是模块内未导出的私有函数，无法直接导入测试。通过创建轻量 wrapper 组件包裹 `ChatBubble` 并使用 `vi.fn()` 追踪渲染次数，可以统一验证所有 props 变化场景下 memo 是否生效。`generateCleanHtml` 被 `useMemo([content])` 包裹，spy 它只能检测 `content` 变化导致的重渲染。对于其他 props 变化，需通过 DOM 断言验证。

#### Scenario: 所有关键 props 相同时不重渲染
- **WHEN** 两次渲染 `ChatBubble`，role、content、reasoningContent、isRunning 完全相同
- **THEN** 渲染追踪器仅在首次渲染时记录 1 次调用，rerender 后调用次数不变（memo 阻止了重复渲染）

#### Scenario: content 变化时触发重渲染
- **WHEN** 两次渲染 `ChatBubble`，content 不同，其他 props 相同
- **THEN** `generateCleanHtml` 在第二次渲染时被重新调用

#### Scenario: role 变化时触发重渲染
- **WHEN** 两次渲染 `ChatBubble`，role 不同（如 user → assistant），其他 props 相同
- **THEN** DOM 结构变化（如外层 className 从 `justify-end` 变为 `justify-start`）

#### Scenario: reasoningContent 变化时触发重渲染
- **WHEN** 两次渲染 `ChatBubble`（role=assistant），reasoningContent 从 undefined 变为有值，其他 props 相同
- **THEN** DOM 中出现 ThinkingSection 相关内容

> 注：ThinkingSection 只在 ASSISTANT 分支渲染（`ChatBubble.tsx:67`），此场景必须设置 role=ASSISTANT。

#### Scenario: isRunning 变化时触发重渲染
- **WHEN** 两次渲染 `ChatBubble`（role=assistant, content="", reasoningContent="some reasoning"），isRunning 从 false 变为 true，其他 props 相同
- **THEN** 组件 DOM 发生变化（ThinkingSection 标题从 thinkingComplete 变为 thinking）

> 注：`thinkingLoading = isRunning && !content`（`ChatBubble.tsx:34`），只有 content 为空时 thinkingLoading 才会随 isRunning 变化。若 content 非空，DOM 不会有可见变化。同时需 reasoningContent 非空才能让 ThinkingSection 出现在 DOM 中。

## Context

5 个组件测试文件 mock 了内部子组件，违反项目"不 Mock 子组件"原则。其中 `ChatPanelContentDetail.test.tsx` 同时 mock 了内部 hooks 并有 46% 的测试仅断言"不崩溃"。`RunningChatBubble.test.tsx` 也 mock 了内部 hook `useSelectedChat` 并有 5 个 not.toThrow 断言。`ChatPage.test.tsx` 在另一个变更（test-p0-eliminate-dead-tests）中处理，不在本变更范围内。

当前正确范例：`InitializationController.test.tsx` 仅 mock Canvas 和第三方 Progress，使用真实子组件。

## Goals / Non-Goals

**Goals:**
- 移除组件测试中的子组件 mock
- 将 `not.toThrow()` 断言替换为实际渲染内容验证
- 移除内部 hook mock，改为通过 Redux state 驱动

**Non-Goals:**
- 不重写整个测试文件（仅修改 mock 和断言模式）
- 不修改被测组件代码
- 不处理 ChatPage.test.tsx（已在另一个变更中处理）

## Decisions

### 决策 1：移除 mock 后的渲染策略

**选择**：使用 `renderWithProviders` 渲染完整组件树

移除 `vi.mock` 后，需要确保 `renderWithProviders` 提供足够的 Provider（Redux、Router、ConfirmProvider、i18n）。如果组件依赖未提供的 context，需要补充到 `renderWithProviders` 或在测试中单独提供。

**理由**：完整组件树渲染能捕获子组件间的集成错误，符合项目测试原则。

### 决策 2：内部 hook mock 替代方案

**选择**：通过 Redux state 驱动 hook 行为

适用于 ChatPanelContentDetail（`useSelectedChat`、`useIsSending`）和 RunningChatBubble（`useSelectedChat`）。这些 hook 均从 Redux store 读取数据，移除 mock 后，通过 `createTypeSafeTestStore` 配置正确的 state 即可。

```typescript
// 替代方案：通过 store state 驱动
const store = createTypeSafeTestStore({
  chat: createChatSliceState({
    activeChatId: 'test-chat-1',
    chats: { 'test-chat-1': mockChat },
  }),
});
```

**替代方案**：在测试级别 mock `useSelectedChat` 但返回从 store 读取的值 → 被否决，因为仍违反"不 mock 内部 hook"原则。

### 决策 3：MobileDrawer Sheet mock 保留

**选择**：保留 Sheet mock，添加注释说明原因

Sheet 是基于 Radix UI 的 shadcn/ui 基础设施组件，依赖 Portal 和复杂的事件系统，在 happy-dom 环境中模拟困难。

### 决策 4：not.toThrow 替换策略

**选择**：逐个替换为实际内容断言

6 个 `not.toThrow()` 测试的替换模式：
- "渲染模型标题" → `expect(screen.getByText(modelName)).toBeInTheDocument()`
- "渲染 RunningChatBubble" → `expect(container.querySelector('[data-testid="running-chat-bubble"]')).toBeInTheDocument()`
- "接收 chatModel prop" → 断言组件使用 prop 数据渲染的内容
- "渲染多条历史消息" → `expect(screen.getAllByTestId('chat-bubble')).toHaveLength(N)`

## Risks / Trade-offs

- [移除 mock 后测试因缺少 Provider 失败] → 缓解：先用 `renderWithProviders` 渲染，逐步补充 Provider
- [子组件渲染可能需要额外的 mock 数据] → 缓解：使用 `createTestRootState` 配置完整 state
- [RunningChatBubble 移除 ChatBubble mock 后测试复杂度增加] → 缓解：测试关注数据传递而非 ChatBubble 内部行为

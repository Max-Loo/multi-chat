## Why

5 个组件测试文件 mock 了不应 mock 的内部子组件，直接违反项目 README.md 中"不 Mock 子组件"的核心测试原则。其中 `ChatPanelContentDetail.test.tsx` 同时 mock 了内部 hooks 并有 6 个测试仅断言 `not.toThrow()`（占全部 13 个测试的 46%），提供零价值覆盖率。`ChatPage.test.tsx` 的 3 个 mock 路径已全部过时，指向不存在的目录结构。这些 mock 使得子组件间的集成错误无法被发现，重构时测试不会失败，形成虚假的安全感。

## What Changes

- **移除** `src/__test__/components/RunningChatBubble.test.tsx` 中对 `ChatBubble` 的 mock —— 改为渲染完整组件树，断言实际数据传递
- **移除** `src/__test__/components/Grid.test.tsx` 和 `Splitter.test.tsx` 中对 `Detail` 的 mock —— 改为渲染完整组件树
- **重写** `src/__test__/components/ChatPanelContentDetail.test.tsx` —— 移除 `useSelectedChat`、`useIsSending` 的内部 hook mock，改为通过 Redux state 驱动行为；将 6 个 `not.toThrow()` 断言替换为实际渲染内容验证
- **评估** `src/__test__/components/MobileDrawer.test.tsx` 中对 Sheet 的 mock —— Sheet 是基于 Radix UI 的 shadcn/ui 基础设施组件，mock 有一定合理性，但需添加注释说明原因
- **不处理** `src/__test__/pages/Chat/ChatPage.test.tsx` —— 3 个过时的 mock 路径已在 `test-p0-eliminate-dead-tests` 中处理（删除文件）。本变更聚焦组件级 mock 修复

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `no-mock-child-components`: 扩展覆盖范围，确保所有组件测试遵循不 mock 子组件原则
- `test-behavior-not-internals`: 重写 ChatPanelContentDetail 测试，从断言"不崩溃"转为验证实际渲染行为
- `chat-panel-testing`: 重写组件测试，使用 renderWithProviders 渲染完整组件树
- `custom-component-testing`: 移除 RunningChatBubble、Grid、Splitter 中的子组件 mock

## Impact

- **修改文件**：5 个（`RunningChatBubble.test.tsx`、`Grid.test.tsx`、`Splitter.test.tsx`、`ChatPanelContentDetail.test.tsx`、`MobileDrawer.test.tsx`）
- **跨变更依赖**：`test-p0-eliminate-dead-tests` 的 design.md 声明本变更会为 ChatPage 创建新测试，但本变更不包含此工作。需在该变更中更新该引用
- **风险**：移除 mock 后测试可能因缺少 Provider 或数据而失败，需要补充必要的 store/Provider 配置
- **Breaking**: 无，仅修改测试代码

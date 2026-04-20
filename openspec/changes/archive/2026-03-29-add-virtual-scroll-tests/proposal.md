## Why

虚拟滚动功能（基于 virtua 库）已在 Detail 消息列表和 Sidebar 对话列表中实现，但缺乏自动化测试覆盖。Detail 组件目前零测试，虚拟化渲染行为（只渲染可见项、滚动更新可见范围）完全未被验证。需要补充测试以确保虚拟滚动的正确性和后续重构的安全性。

## What Changes

- 新增高级 virtua mock（MockVirtualizer / MockVList），支持模拟虚拟化渲染行为（只渲染可见范围内的子项），替代现有的简单透传 div mock
- 新增 Detail 组件单元测试，覆盖虚拟化渲染、固定元素、滚动到底部、流式自动跟随等核心行为
- 新增 RunningBubble 组件单元测试，覆盖渲染逻辑（selector 收窄通过代码审查验证）
- 新增 ChatBubble memo 重渲染行为测试，通过 React 组件重渲染追踪间接验证 arePropsEqual 的正确性
- 复用已有 `createMockPanelChatModel`（`helpers/mocks/panelLayout.tsx`）构造 Detail 所需的 ChatModel fixture（`types/chat.ts` 的 `ChatModel`，含 `modelId` + `chatHistoryList`）

## Capabilities

### New Capabilities

- `virtua-test-mock`: 高级 virtua 虚拟滚动 mock，支持可见范围计算、滚动模拟、渲染项追踪
- `detail-component-tests`: Detail 消息列表组件测试，覆盖虚拟化渲染、滚动行为、固定元素、流式跟随
- `running-bubble-tests`: RunningBubble 组件测试，覆盖渲染状态（selector 收窄由代码审查验证）
- `chat-bubble-memo-tests`: ChatBubble memo 重渲染行为测试（间接验证 arePropsEqual）

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- 测试文件：新增 `src/__test__/pages/Chat/Detail.test.tsx`、`src/__test__/pages/Chat/RunningBubble.test.tsx`、`src/__test__/components/chat/ChatBubble.memo.test.tsx`
- 测试辅助：新增 virtua mock 工具 `src/__test__/helpers/mocks/virtua.ts`，滚动指标 mock `src/__test__/helpers/mocks/scrollMetrics.ts`；复用已有的 `createMockPanelChatModel`（`src/__test__/helpers/mocks/panelLayout.tsx`）
- 依赖：无新增运行时依赖，仅涉及测试代码

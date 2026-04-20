## Context

7 个 P1 级别质量问题分散在 12 个文件中：CSS 类名断言、本地工厂函数重复、裸 action type dispatch、覆盖不充分的 hook 测试、名不副实的集成测试。

已有正确范例：`chatSelectors.test.ts` 测试 memoization、`InitializationController.test.tsx` 使用语义化查询。

## Goals / Non-Goals

**Goals:**
- 将 CSS 类名断言替换为语义化查询
- 消除本地工厂函数，统一使用全局 fixtures
- 修复裸 action type dispatch
- 补充 useAutoResizeTextarea 关键路径覆盖
- 修复 drawer-state 集成测试

**Non-Goals:**
- 不重构整个测试文件结构
- 不修改被测组件的 DOM 结构（除非为可访问性添加 aria 属性）
- 不处理 P2/P3 级别问题

## Decisions

### 决策 1：CSS 类名断言替换策略

**选择**：按优先级使用语义化查询

替换策略：
1. `getByRole('button', { name: '发送' })` → 用于交互元素
2. `getByLabelText('搜索')` → 用于表单元素
3. `getByText('聊天列表')` → 用于文本内容
4. `getByTestId('nav-container')` → 仅在无语义化查询可用时使用

**如果组件缺少 aria 属性或 role**：在测试注释中标注"需组件配合添加可访问性属性"，使用 `getByTestId` 作为临时方案。

**替代方案**：直接删除 CSS 类名断言而不替换 → 被否决，因为会降低有效覆盖率。

### 决策 2：工厂函数统一路径

**选择**：从实际存在的全局模块导入

统一导入：
```typescript
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';
```

全局 `createMockChat` 签名为 `(overrides?: Partial<Chat>) => Chat`（override 模式）。

**API 迁移**：`useCurrentSelectedChat.test.tsx` 和 `useExistingChatList.test.tsx` 中的本地 `createMockChat` 使用 positional 参数，替换时需同步更新所有调用点：
- `createMockChat(id, name)` → `createMockChat({ id, name })`
- `createMockChat(id, isDeleted)` → `createMockChat({ id, isDeleted })`

**理由**：与 commit `c917016` 的"统一 createMockModel"方向一致。

### 决策 3：裸 action type 修复策略

**选择**：使用真实 action creator

chatSlices.test.ts 中存在 22 处裸 action type dispatch，涉及三类：

1. **thunk lifecycle actions**（使用 `.pending()`/`.fulfilled()`/`.rejected()`）：
   - `chatModel/sendMessage` — 行 158, 181, 193, 216, 222, 252, 256, 367
   - `chatModel/startSendChatMessage` — 行 272
   - `chat/generateName` — 行 440, 455, 467

2. **slice actions**（直接调用导出的 action creator）：
   - `chat/pushRunningChatHistory` — 行 187, 262, 266, 373
   - `chat/pushChatHistory` — 行 330, 348
   - `chat/editChatName` — 行 389, 404, 421

3. **thunk rejected**（行 302）：`chat/initialize/rejected`

替换方式：
- thunk lifecycle → `dispatch(sendMessage.pending(requestId, arg))` 等
- slice actions → `dispatch(pushRunningChatHistory({...}))` 等

**理由**：手动构造的 action 可能缺少 `requestId`、`meta` 等字段，导致 reducer 行为不一致。

### 决策 4：useAutoResizeTextarea 新增测试

**选择**：补充 3 个关键路径

1. `isScrollable=true` 当 scrollHeight > maxHeight
2. 高度回缩 当值从多行变为单行
3. 动态 minHeight/maxHeight 参数变化

删除 null ref 测试（React 环境中不可能发生）。

### 决策 5：drawer-state 修复策略

**选择**：在现有测试中增加 DOM 断言

在 `store.getState()` 断言之后，增加 `waitFor(() => { expect(screen.getByRole('complementary')).toBeInTheDocument() })` 等断言，验证渲染结果与 state 一致。

## Risks / Trade-offs

- [语义化查询需要组件配合] → 缓解：优先使用 `getByTestId`，在注释中标注可访问性改进建议
- [useAutoResizeTextarea DOM 模拟困难] → 缓解：使用 `Object.defineProperty` mock `scrollHeight`/`clientHeight`
- [drawer-state 增加 DOM 断言可能需要调试] → 缓解：先确认 renderChatPage 返回的 DOM 结构

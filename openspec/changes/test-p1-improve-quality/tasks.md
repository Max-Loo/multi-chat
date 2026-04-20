## 实施任务清单

### T1: 替换 BottomNav.test.tsx CSS 类名断言
- [x] 将 `toHaveClass('border-t', 'bg-background', 'h-16')` 等替换为语义化查询
- [x] 优先使用 `getByRole('navigation')`、`getByTestId` 等
- **文件**: `src/__test__/components/BottomNav.test.tsx`

### T2: 替换 ChatPanelHeader.test.tsx CSS 类名断言
- [x] 将 `toHaveClass('flex', 'items-center')` 等替换为语义化查询
- **文件**: `src/__test__/components/ChatPanelHeader.test.tsx`

### T3: 替换 ChatPanelSender.test.tsx CSS 类名断言
- [x] 将 `toHaveClass("border-0")`、`toHaveClass("rounded-none")` 等替换为语义化查询
- **文件**: `src/__test__/components/ChatPanelSender.test.tsx`

### T4: 替换 Layout.test.tsx CSS 类名断言
- [x] 将 `toHaveClass('flex', 'h-screen', 'bg-white')` 等替换为语义化查询
- **文件**: `src/__test__/components/Layout.test.tsx`

### T5: 替换 Grid.test.tsx CSS 类名断言
- [x] 将 `querySelectorAll('.flex.w-full.flex-1')` 等 CSS 选择器替换为 `getByRole`/`getByTestId`
- **文件**: `src/__test__/components/Grid.test.tsx`

### T6: 替换 NotFound/index.test.tsx CSS 类名断言
- [x] 将 `expect(icon?.className).toContain('h-32')` 等替换为语义化查询
- **文件**: `src/__test__/pages/NotFound/index.test.tsx`

### T7: 统一 chatSlices.test.ts 工厂函数
- [x] 删除本地 `createMockChat`（第 78 行）和 `createMockMessage`（第 87 行）
- [x] 从全局模块导入：`import { createMockChat } from '@/__test__/helpers/testing-utils'`、`import { createMockMessage } from '@/__test__/fixtures/chat'`
- [x] 确认全局函数签名与本地版本一致（两者均为 `Partial<T> => T` override 模式，签名兼容）
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`

### T8: 统一 useCurrentSelectedChat 和 useExistingChatList 工厂函数
- [x] `useCurrentSelectedChat.test.tsx`：删除本地 `createMockChat`（第 8 行），从全局导入
- [x] `useExistingChatList.test.tsx`：删除本地 `createMockChat`（第 7 行），从全局导入
- [x] `useCurrentSelectedChat.test.tsx`：将所有 `createMockChat(id, name)` 调用改为 `createMockChat({ id, name })`（API 签名从 positional 改为 override）
- [x] `useExistingChatList.test.tsx`：将所有 `createMockChat(id, isDeleted)` 调用改为 `createMockChat({ id, isDeleted })`
- [x] 导入路径：`import { createMockChat } from '@/__test__/helpers/testing-utils'`
- **文件**: `src/__test__/hooks/useCurrentSelectedChat.test.tsx`、`src/__test__/hooks/useExistingChatList.test.tsx`

### T9: 修复 chatSlices.test.ts 全部裸 action type dispatch（22 处）
- [x] **thunk lifecycle — sendMessage**（行 158, 181, 193, 216, 222, 252, 256, 367）：
  - `.pending` → `sendMessage.pending(requestId, arg)`
  - `.fulfilled` → `sendMessage.fulfilled(payload, requestId, arg)`
  - `.rejected` → `sendMessage.rejected(error, requestId, arg)`
- [x] **thunk lifecycle — startSendChatMessage**（行 272）：
  - `.rejected` → `startSendChatMessage.rejected(error, requestId, arg)`
- [x] **thunk lifecycle — generateName**（行 440, 455, 467）：
  - `.fulfilled` → `generateName.fulfilled(payload, requestId, arg)`
- [x] **thunk lifecycle — chat/initialize**（行 302）：
  - `.rejected` → `initialize.rejected(error, requestId, arg)` 或对应 thunk action creator
- [x] **slice actions**（直接调用导出的 action creator）：
  - `chat/pushRunningChatHistory`（行 187, 262, 266, 373）→ `dispatch(pushRunningChatHistory({...}))`
  - `chat/pushChatHistory`（行 330, 348）→ `dispatch(pushChatHistory({...}))`
  - `chat/editChatName`（行 389, 404, 421）→ `dispatch(editChatName({...}))`
- [x] 确认所有替换后 `requestId`、`meta`、`payload` 等字段与 Redux Toolkit 生成的 action 一致
- **文件**: `src/__test__/store/slices/chatSlices.test.ts`

### T10: 修复 modelProviderSlice.test.ts 全部裸 action type dispatch（9 处）
- [x] `modelProvider/initializeModelProvider/rejected`（行 114, 317）→ 使用 `initializeModelProvider.rejected(error, requestId, arg)`
- [x] `modelProvider/initialize/rejected`（行 336, 371, 518）→ 确认对应 thunk 名称，使用 action creator
- [x] `modelProvider/refresh/pending`（行 402）→ 使用 `refresh.pending(requestId, arg)`
- [x] `modelProvider/silentRefresh/pending`（行 425, 478, 499）→ 使用 `silentRefresh.pending(requestId, arg)`
- [x] 确认所有 thunk 名称与 `createAsyncThunk` 定义一致
- [x] 确认 `requestId`、`meta`、`payload` 等字段与 Redux Toolkit 生成的 action 一致
- **文件**: `src/__test__/store/slices/modelProviderSlice.test.ts`

### T11: 补充 useAutoResizeTextarea 测试覆盖
- [x] 新增测试：`scrollHeight > maxHeight` 时 `isScrollable` 为 true
- [x] 新增测试：值从多行变为单行时高度回缩
- [x] 新增测试：动态改变 `maxHeight` 参数后 `isScrollable` 重新计算
- [x] 删除 null ref 测试（React 环境中不可能发生）
- [x] 使用 `Object.defineProperty` mock `scrollHeight`/`clientHeight`
- **文件**: `src/__test__/hooks/useAutoResizeTextarea.test.tsx`

### T12: 修复 drawer-state.integration.test.tsx
- [x] 在 `store.getState()` 断言后增加 DOM 断言：
  - 抽屉打开时验证侧边栏组件出现在 DOM 中
  - 抽屉关闭时验证侧边栏组件不在 DOM 中
- [x] 使用 `waitFor(() => { expect(screen.getByRole(...)).toBeInTheDocument() })` 模式
- [x] 将仅验证 reducer 逻辑的测试用例标注为应移到单元测试
- **文件**: `src/__test__/integration/drawer-state.integration.test.tsx`

### T13: 运行测试验证
- [x] 执行 `pnpm test` 确认全部测试通过
- [x] 检查覆盖率是否仍满足 60% 阈值
- **验证命令**: `pnpm test`

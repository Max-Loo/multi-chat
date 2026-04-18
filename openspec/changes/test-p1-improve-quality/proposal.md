## Why

7 个 P1 级别的测试质量问题降低了测试套件的可维护性和有效性：6 个文件系统性断言 Tailwind CSS 类名而非用户可见行为；3 个文件定义了与全局 fixtures 重复的本地工厂函数；1 个文件直接 dispatch 裸 action type 字符串；1 个集成测试名为集成实则仅验证 reducer 逻辑；1 个 hook 测试覆盖极度不充分。这些问题使测试在 CSS 重构或架构调整时产生大量误报，并增加了维护成本。

## What Changes

- **替换 CSS 类名断言**：6 个文件（`BottomNav.test.tsx`、`ChatPanelHeader.test.tsx`、`ChatPanelSender.test.tsx`、`Layout.test.tsx`、`Grid.test.tsx`、`NotFound/index.test.tsx`）中的 `toHaveClass('border-t', 'bg-background')` 等断言替换为 `getByRole`、`getByLabelText` 等语义化查询
- **统一工厂函数来源**：删除 `chatSlices.test.ts`、`useCurrentSelectedChat.test.tsx`、`useExistingChatList.test.tsx` 中的本地 `createMockChat`/`createMockMessage` 定义，从全局 fixtures 导入
- **修复裸 action type dispatch**：`chatSlices.test.ts` 中 6 处 `type: 'chatModel/sendMessage/pending'` 等裸字符串改为使用真实 thunk action creator
- **修复 `modelProviderSlice.test.ts` 中裸 action type 不一致**：第 114 行 `initializeModelProvider/rejected` 与第 336 行 `initialize/rejected` 不一致，至少一处不匹配实际 action type
- **补充 `useAutoResizeTextarea.test.tsx` 测试覆盖**：新增 maxHeight 超出时 isScrollable=true、多行到单行高度回缩、动态 minHeight/maxHeight 三条路径测试，移除不可能发生的 null ref 测试
- **修复 `drawer-state.integration.test.tsx`**：增加 DOM 断言（如抽屉打开时侧边栏是否出现在 DOM 中），将纯 reducer 测试移到单元测试文件

## Capabilities

### New Capabilities

- `auto-resize-textarea-coverage`: 补充 useAutoResizeTextarea hook 的关键行为路径测试

### Modified Capabilities

- `test-factory-utilization`: 消除 3 个文件中的本地工厂函数，统一使用全局 fixtures
- `chat-slices-testing`: 修复裸 action type dispatch，使用真实 thunk action creator
- `integration-test-coverage`: 修复 drawer-state 集成测试，增加 DOM 断言
- `model-slice-testing`: 修复 modelProviderSlice 中不一致的裸 action type

## Impact

- **修改文件**：约 12 个
- **新增测试用例**：约 5-8 个（useAutoResizeTextarea 覆盖补充、drawer-state DOM 断言）
- **裸 action type 修复**：chatSlices.test.ts 22 处、modelProviderSlice.test.ts 9 处
- **工厂函数迁移**：3 个文件，其中 2 个需同步更新调用点 API 签名（positional → override）
- **风险**：替换 CSS 类名断言可能需要调整组件的可访问性属性以支持语义化查询
- **Breaking**: 无，仅修改测试代码

## Why

ChatBubble 的编辑态和操作栏使用了原生 HTML 元素（`<textarea>`、`<button>`），与项目 UI 组件库风格不统一。编辑态的 Card 背景色块与 textarea 边框重复，操作栏按钮缺少 `cursor: pointer`，AI 生成期间用户消息的翻页控件未禁用。这些问题导致交互体验不一致，需要统一优化。

## What Changes

- 编辑态去掉 Card 背景色块，改用 UI Textarea 组件 + `useAutoResizeTextarea` hook，输入框自动伸缩（60px–240px）
- 操作栏（ActionToolbar）所有按钮改用 UI Button 组件（`ghost` variant），统一风格并自带 `cursor: pointer`
- HistoryPager 增加 `disabled` prop，AI 生成期间禁用用户消息的编辑和翻页
- 编辑确认/取消按钮改用 UI Button 组件，移至 Card 外部独立显示
- 编辑态宽度与展示态保持一致（`max-w-[80%]`）

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `message-operations`: 编辑态 UI 布局和组件替换（Card → 无背景、原生 textarea → UI Textarea、原生 button → UI Button）；操作栏和翻页控件的禁用状态扩展

## Impact

- **代码文件**：`src/components/chat/ChatBubble.tsx`（主要改动）
- **依赖组件**：`src/components/ui/textarea.tsx`、`src/components/ui/button.tsx`、`src/hooks/useAutoResizeTextarea.ts`
- **测试文件**：`src/__test__/components/ChatBubble.test.tsx`（如有）需更新快照或断言
- **无 API 变更**、无破坏性变更、无新增依赖

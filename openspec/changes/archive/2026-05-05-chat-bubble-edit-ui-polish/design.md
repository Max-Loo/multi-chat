## Context

ChatBubble 组件当前在编辑态和操作栏中使用原生 HTML 元素（`<textarea>`、`<button>`），而项目已有统一的 UI 组件库（`src/components/ui/`）。消息输入框（`Sender.tsx`）已使用 UI Textarea + `useAutoResizeTextarea` hook，但编辑态的 textarea 仍是原生实现，体验不一致。

当前编辑态布局：Card（灰底）包裹 textarea + 确认/取消按钮。展示态布局：Card（灰底）包裹内容，操作栏在 Card 外。两种状态视觉切换突兀。

## Goals / Non-Goals

**Goals:**

- 编辑态与展示态视觉区分清晰（灰底卡片 vs 边框输入框）
- 编辑态和操作栏统一使用 UI 组件库（Textarea、Button）
- 编辑态 textarea 自动伸缩，与 Sender.tsx 体验一致
- AI 生成期间用户消息的编辑和翻页控件禁用
- 操作栏按钮 hover 时显示 pointer 光标

**Non-Goals:**

- 不改变消息操作的业务逻辑（编辑、重新生成、复制的流程不变）
- 不改变 ChatBubble 的 memo 比较策略
- 不涉及 AI 消息气泡的布局改动
- 不引入新依赖

## Decisions

### 1. 编辑态去掉 Card，使用 UI Textarea + 边框

**选择**：编辑态不再渲染 Card 组件，直接使用 UI Textarea，靠 textarea 自身的 border 区分编辑区域。

**替代方案**：保留 Card 但改变背景色（如白底）→ 与展示态区分不够明显，且增加了不必要的嵌套。

**理由**：去掉 Card 后编辑态和展示态的视觉差异最大——灰底卡片 vs 白底带边框输入框，用户一眼可辨。同时 textarea 宽度不受 Card padding 限制。

### 2. 引入 useAutoResizeTextarea hook

**选择**：复用 `src/hooks/useAutoResizeTextarea.ts`，参数与 Sender.tsx 一致（minHeight: 60, maxHeight: 240）。

**理由**：编辑消息时内容长度不确定，固定高度体验差。复用已有 hook 避免重复实现。

### 3. 操作栏按钮统一使用 UI Button（ghost variant）

**选择**：ActionToolbar 和 HistoryPager 中所有 `<button>` 替换为 `<Button variant="ghost" size="icon" className="size-7">`。

**替代方案**：仅添加 `cursor-pointer` class → 不统一，且无法复用 Button 的 dark mode 和 focus 样式。

**理由**：ghost variant 的 hover 效果与主题系统一致，Button 自带 `cursor-pointer`、dark mode、disabled 样式，减少手写 CSS。

### 4. HistoryPager 增加 disabled prop

**选择**：HistoryPager 组件增加 `disabled?: boolean` prop，传入 `isChatSending` 状态。

**理由**：AI 生成期间，用户不应操作历史翻页（可能导致与编辑操作的竞态）。编辑按钮已有 disabled 逻辑，翻页应保持一致。

### 5. 编辑确认/取消按钮移到 textarea 外部

**选择**：编辑态结构为 `[Textarea] → [按钮行]`，不使用 Card 包裹。

**理由**：与展示态的操作栏位置对齐（都在"气泡"区域外部），布局风格一致。按钮同样使用 UI Button 组件。

## Risks / Trade-offs

- **编辑态无背景色块** → 可能导致长消息编辑时输入框边界不够明显。缓解：UI Textarea 自带 border，足够区分。
- **Button ghost variant 的 hover 色与当前手动写的不完全一致** → ghost 使用 `hover:bg-accent`，与主题绑定更规范，属于正向改进。
- **useAutoResizeTextarea 依赖 ref** → 编辑态的 textarea 需要将 UI Textarea 的 ref 与 hook 的 ref 合并，实现上需注意 forwardRef 传递。

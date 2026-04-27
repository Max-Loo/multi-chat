## Context

ChatButton 是聊天列表中的单个聊天按钮组件，当前通过 DropdownMenu（⋯ 按钮）提供「重命名」和「删除」操作。删除操作需要经过确认对话框。组件使用 `memo` 包裹，有自定义比较函数，且使用 `useResponsive` 适配不同布局尺寸。

## Goals / Non-Goals

**Goals:**
- 为高级用户提供 Shift+悬停的一步快捷删除操作
- 覆盖两种操作顺序：先按 Shift 再悬停、先悬停再按 Shift
- 保持与现有 DropdownMenu 删除行为一致（调用相同 action、处理 isSelected 逻辑）

**Non-Goals:**
- 不添加误触防护延迟（Shift 键本身是足够的 modifier guard）
- 不添加视觉过渡动画
- 不修改 memo 比较函数或组件 props 接口
- 不修改现有 DropdownMenu 的行为

## Decisions

### 1. Shift 键状态追踪方案：全局 keydown/keyup + 组件内 hover 双状态

**选择**：使用 `useEffect` 注册 document 级别的 `keydown`/`keyup` 事件监听追踪 `isShiftDown`，组件内 `onMouseEnter`/`onMouseLeave` 追踪 `isHovering`。两个 state 同时为 true 时触发快捷删除按钮。

**替代方案**：
- 仅在 `onMouseEnter` 中读取 `event.shiftKey`：无法覆盖「先悬停再按 Shift」的场景
- 仅使用全局监听：需要额外判断鼠标是否在组件范围内

**理由**：双状态方案覆盖所有操作顺序，逻辑清晰，每个状态职责单一。

### 2. 渲染策略：条件替换 DropdownMenu

**选择**：当 `isShiftDown && isHovering` 为 true 时，不渲染 DropdownMenu，改为渲染一个红色背景的删除按钮。

**替代方案**：
- 在 DropdownMenu 内部切换内容：会保留下拉菜单的触发行为，不符合需求
- 覆盖 DropdownMenu 上层：增加 DOM 层级和复杂度

**理由**：完全替换更简洁，避免 DropdownMenu 和删除按钮之间的状态冲突。

### 3. 删除逻辑：提取 directDelete 函数

**选择**：从现有 `handleDelete` 中提取核心删除逻辑（dispatch `deleteChat` + toast + `clearChatIdParam`）到 `directDelete` 函数，跳过 `modal.warning` 确认步骤。

**理由**：复用现有逻辑，避免重复代码。不修改原 `handleDelete`，保持向后兼容。

### 4. 事件监听清理

**选择**：在 `useEffect` 的 cleanup 函数中移除 document 事件监听器。

**理由**：防止组件卸载后的内存泄漏和无效回调。

## Risks / Trade-offs

- **[无确认删除]** → Shift 键作为 modifier guard 提供了足够的操作门槛，桌面系统中类似的快捷键（如 macOS Cmd+Delete）也是无确认直接操作
- **[全局事件监听性能]** → 仅有两个 lightweight event listener（keydown/keyup），对性能无影响
- **[组件卸载时的竞态]** → useEffect cleanup 确保监听器正确移除，无竞态风险

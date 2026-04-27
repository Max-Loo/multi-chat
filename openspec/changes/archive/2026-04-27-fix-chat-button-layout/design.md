## Context

ChatButton 组件当前使用 `flex justify-between` 布局，左侧名称区域（`<span>`）仅设置了 `min-w-0`，缺少 `flex-1` 和 `overflow-hidden`。当聊天名称过长时，名称区域的文本节点撑开容器宽度，挤压右侧操作按钮。

```
当前布局（名称过长时）:
┌─ div: flex justify-between ──────────────────────┐
│  ┌─ span: min-w-0 ────────────────┐  ┌─ btn ──┐ │
│  │ 超长聊天名称撑开容器...         │  │ 被压缩 │ │
│  └────────────────────────────────┘  └─────────┘ │
└──────────────────────────────────────────────────┘

修复后:
┌─ div: flex ──────────────────────────────────────┐
│  ┌─ span: flex-1 overflow-hidden ──┐  ┌─ btn ──┐ │
│  │ 超长聊天名称被 truncate 截断... │  │ 保持完整│ │
│  └─────────────────────────────────┘  └─────────┘ │
└──────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- 左侧名称区域在任意长度下正确截断，不挤压右侧按钮
- 右侧操作按钮（更多菜单 / 快捷删除）始终保持固定尺寸
- 重命名状态的布局不受影响

**Non-Goals:**
- 不改变组件逻辑、状态管理或交互行为
- 不修改 DropdownMenu 或其他子组件
- 不涉及 Tooltip 功能变更

## Decisions

**决策：在左侧 `<span>` 上添加 `flex-1 overflow-hidden`**

当前左侧 `<span>`（L222）只有 `min-w-0 pl-2`。在 flex 容器中，`min-w-0` 允许元素收缩到小于内容宽度，但需要 `flex-1` 让元素占据剩余空间、`overflow-hidden` 让 `truncate` 生效。

三者配合：
- `flex-1` → 占据右侧按钮之外的所有剩余空间
- `overflow-hidden` → 隐藏溢出内容，让 `text-overflow: ellipsis`（Tailwind `truncate` 类）生效
- `min-w-0` → 允许 flex 子项收缩到 0（已有，保留）

备选方案：
- 方案 B：给外层 div 加 `overflow-hidden` — 不够精确，可能影响右侧按钮的 dropdown 弹出
- 方案 C：使用 CSS Grid 替代 flex — 改动过大，不适合小修复

## Risks / Trade-offs

- **风险**：`overflow-hidden` 是否影响 dropdown 定位 → 不会，DropdownMenu 使用 Radix Portal，不受父容器 overflow 影响
- **风险**：重命名状态的布局是否受影响 → 不会，重命名状态是独立分支（L167-200），不经过这段代码

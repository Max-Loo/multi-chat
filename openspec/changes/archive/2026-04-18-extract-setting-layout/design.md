## Context

至少 4 个组件包含相同的滚动容器样板代码：`KeyManagementSetting`、`GeneralSetting`、`SettingSidebar`、`ToastTest`。模式为：调用 `useAdaptiveScrollbar()` 获取 `scrollbarClassname` 和 `onScrollEvent`，创建 `useRef<HTMLDivElement>`，在 `useEffect` 中绑定/解绑 scroll 事件。每次使用需复制约 10 行代码。

## Goals / Non-Goals

**Goals:**
- 提取 `useScrollContainer` hook 封装完整滚动容器逻辑
- 在 `KeyManagementSetting` 和 `GeneralSetting` 中验证新 hook
- 保持与现有 `useAdaptiveScrollbar` 的兼容性

**Non-Goals:**
- 不在本变更中重构 `SettingSidebar` 和 `ToastTest`（可后续单独处理）
- 不修改 `useAdaptiveScrollbar` 本身的实现
- 不提取 `SettingPageLayout` 组件（hook 方式更灵活，不限制 JSX 结构）

## Decisions

### 1. Hook vs 组件

**选择**：提取 `useScrollContainer()` hook

**替代方案**：提取 `<SettingPageLayout>` 组件

**理由**：各设置页面的 JSX 结构差异较大（不同的子组件、不同的布局），强制统一外层组件会限制灵活性。hook 只封装逻辑，不约束渲染结构。

### 2. hook 返回值设计

**选择**：返回 `{ scrollContainerRef, scrollbarClassname }`

**替代方案**：返回 `{ ref, className, onScroll }` 三个值

**理由**：调用方只需将 `scrollContainerRef` 绑定到容器 div 的 `ref`，将 `scrollbarClassname` 加入容器的 `className`。`onScroll` 由 hook 内部处理，调用方无需关心。接口最简。

### 3. hook 放置位置

**选择**：`src/hooks/useScrollContainer.ts`

**理由**：项目已有 `src/hooks/` 目录（如 `useResetDataDialog.ts`、`useAdaptiveScrollbar.ts`），新 hook 遵循既有组织方式。

## Risks / Trade-offs

- **仅覆盖 2 个组件** → 本次变更只替换 `KeyManagementSetting` 和 `GeneralSetting`，`SettingSidebar` 和 `ToastTest` 的重构留作后续。不重构不影响功能。
- **`useAdaptiveScrollbar` 仍独立存在** → 已有代码直接使用 `useAdaptiveScrollbar` 的地方无需迁移。`useScrollContainer` 是可选的便捷封装。

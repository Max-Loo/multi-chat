# Design: MobileDrawer 最小宽度

## Context

当前 `MobileDrawer` 组件使用 `w-fit` 让抽屉宽度由内容决定，配合 `max-w-[85vw]` 和 `sm:max-w-md` 限制最大宽度。但当内容较少时（如某些侧边栏内容），抽屉可能变得过窄，影响用户体验。

**当前实现**：
```tsx
<SheetContent className="w-fit max-w-[85vw] sm:max-w-md" ...>
```

**技术约束**：
- 使用 shadcn/ui Sheet 组件
- 使用 Tailwind CSS 工具类
- 需要保持响应式设计

## Goals / Non-Goals

**Goals:**
- 添加最小宽度约束（240px）确保抽屉不会过窄
- 保持现有的响应式最大宽度约束
- 不影响现有功能和行为

**Non-Goals:**
- 不修改抽屉的打开/关闭逻辑
- 不修改其他组件（如 ChatSidebar、SettingSidebar、ModelSidebar）
- 不改变抽屉的动画效果

## Decisions

### 1. 使用 Tailwind 的 min-w-60 工具类

**决定**：使用 `min-w-60`（最小宽度 240px）作为最小宽度约束。

**理由**：
- Tailwind 的 `min-w-60` 对应 `min-width: 15rem`（240px）
- 与现有的 `w-fit`、`max-w-[85vw]`、`sm:max-w-md` 配合使用，形成完整的宽度约束
- 240px 足够容纳大部分侧边栏内容（ChatSidebar 224px、SettingSidebar 256px、ModelSidebar 240px）

**替代方案**：
- 使用 `min-w-[240px]`：效果相同，但 Tailwind 推荐使用工具类而非任意值
- 使用 `min-w-56`（224px）：刚好匹配 ChatSidebar 宽度，但对其他侧边栏可能太窄

### 2. 修改位置

**决定**：在 `src/components/MobileDrawer/index.tsx` 第 38 行的 `SheetContent` 组件中添加 `min-w-60`。

**实现**：
```tsx
<SheetContent
  aria-description={t(($) => $.navigation.mobileDrawer.ariaDescription)}
  side="left"
  className="w-fit max-w-[85vw] sm:max-w-md min-w-60"
  showCloseButton={showCloseButton}
>
```

## Risks / Trade-offs

### Risk: 在某些设备上可能影响布局
**风险**：在非常小的设备上（屏幕宽度 < 240px），240px 的最小宽度可能导致抽屉超出屏幕。

**缓解措施**：
- 现有的 `max-w-[85vw]` 会限制最大宽度为视窗宽度的 85%
- 在极端情况下，内容会水平滚动，但这比抽屉过窄导致内容无法显示要好

### Trade-off: 固定最小宽度 vs 完全自适应
**权衡**：选择固定最小宽度（240px）而不是完全由内容决定。

**理由**：
- 完全自适应可能导致内容较少时抽屉过窄，影响可读性和可点击性
- 240px 是一个合理的最小宽度，适合移动端侧边栏
- 现有的 `w-fit` 仍然允许抽屉根据内容扩展到最大宽度

## Migration Plan

### 实施步骤
1. 修改 `src/components/MobileDrawer/index.tsx` 第 38 行
2. 在 `className` 属性中添加 `min-w-60`
3. 测试在不同设备上的显示效果
4. 验证各侧边栏（Chat、Settings、Models）在抽屉中的显示

### 回滚策略
如果出现问题，只需从 `className` 中移除 `min-w-60` 即可回滚。

## Open Questions

无（此改动简单直接，无需进一步讨论）。

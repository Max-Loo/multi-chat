## Why

在测试从 `container.querySelector` 迁移到语义化查询的重构中，`responsive-layout-switching` 集成测试里的 3 处 `querySelector`（使用 CSS `:not()` 伪类选择器区分导航元素）被遗漏。这些残留查询与迁移目标矛盾，且高度依赖实现细节（Sidebar nav 的 `aria-label` 值），脆弱且难以维护。同时 BottomNav 组件的 `<nav>` 缺少 `aria-label`，导致无法用语义化查询区分不同导航区域。

## What Changes

- 为 BottomNav 组件的 `<nav>` 添加 `aria-label="底部导航"` 属性
- 将集成测试中 3 处 `querySelector` 替换为 `screen.queryByRole('navigation', { name: '底部导航' })` 等语义化查询
- 同步更新 BottomNav 单元测试中受影响的断言

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `bottom-navigation`: 为 `<nav>` 元素添加 `aria-label` 属性，使语义化查询可定位到底部导航

## Impact

- **组件代码**: `src/components/BottomNav/index.tsx`（添加 aria-label）
- **集成测试**: `src/__test__/integration/responsive-layout-switching.integration.test.tsx`（替换 querySelector）
- **单元测试**: `src/__test__/components/BottomNav.test.tsx`、`src/__test__/integration/bottom-nav.integration.test.tsx`（可能需要同步更新）
- **无 API 变更**、无依赖变更、无破坏性变更

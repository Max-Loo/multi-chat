# Proposal: MobileDrawer 最小宽度

## Why

当前 MobileDrawer 组件缺少最小宽度限制，当抽屉内容较少时可能导致抽屉过窄，影响用户体验。添加最小宽度可确保抽屉始终保持合理的显示宽度。

## What Changes

- 在 `MobileDrawer` 组件的 `SheetContent` 中添加 `min-w-60` (最小宽度 240px)
- 修改位置：`src/components/MobileDrawer/index.tsx` 第 38 行的 `className` 属性

## Capabilities

### New Capabilities
无

### Modified Capabilities
无（此改动仅涉及 UI 样式实现，不影响功能需求）

## Impact

- **受影响代码**: `src/components/MobileDrawer/index.tsx`
- **变更类型**: UI 样式调整
- **向后兼容**: 是（仅添加最小宽度约束）
- **依赖变更**: 无

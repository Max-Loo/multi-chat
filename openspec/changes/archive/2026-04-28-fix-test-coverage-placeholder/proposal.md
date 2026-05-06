## Why

`src/pages/Chat/components/Placeholder` 的分支覆盖率仅为 44.44%（8/18），根因是缺少移动端测试场景——现有测试中 `useResponsive` 始终返回 `isMobile: false`，导致 `isMobile && (...)` 条件渲染的 true 分支和 `openDrawer` 回调函数完全未被覆盖。该组件逻辑简单（~15 行有效代码），补充测试成本极低。

## What Changes

- 新建 `Placeholder` 组件的专门测试文件 `src/__test__/pages/Chat/Placeholder.test.tsx`
- 覆盖 `isMobile: true` 下的条件渲染（两个操作按钮：菜单按钮和新建聊天按钮）
- 覆盖 `openDrawer` 回调（点击菜单按钮触发 `dispatch(toggleDrawer())`）
- 覆盖 `createNewChat` 回调（点击新建聊天按钮）
- 覆盖 `isMobile: false` 下的桌面端行为（不渲染移动端按钮）

## Capabilities

### New Capabilities
- `placeholder-testing`: Placeholder 组件的单元测试，覆盖移动端和桌面端两种渲染模式下的 UI 渲染和交互行为

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **新增文件**: `src/__test__/pages/Chat/Placeholder.test.tsx`
- **依赖**: 复用现有 mock 基础设施（`@/__test__/helpers/mocks`）
- **CI**: 不影响现有测试，新增测试将纳入覆盖率统计

## Why

`src/pages/Setting/components` 分支覆盖率仅 32.25%（20/62），是全项目最低的模块。`SettingHeader.tsx` 分支覆盖率为 0%（17/17 未覆盖），因完全无测试且被 `isMobile` 条件渲染包裹从未挂载；`SettingSidebar.tsx` 为 44.44%（25/45 未覆盖），缺少点击导航和防重复点击的交互测试。两个组件逻辑简单，补充测试成本极低。

## What Changes

- 新建 `SettingHeader` 组件的专门测试文件，覆盖移动端模式下的按钮渲染和 `toggleDrawer` dispatch
- 在现有 `SettingPage.test.tsx` 中补充 `SettingSidebar` 的 `onClickSettingBtn` 点击导航测试
- 补充 `SettingSidebar` 防重复点击逻辑测试（点击已选中按钮不触发 `navigate`）
- 补充 `SettingSidebar` 移动端样式分支测试（`isDesktop: false`）

## Capabilities

### New Capabilities
- `setting-header-testing`: SettingHeader 组件的单元测试，覆盖移动端渲染和 openDrawer 交互
- `setting-sidebar-interaction-testing`: SettingSidebar 组件的交互行为测试，覆盖点击导航、防重复点击和移动端样式

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **新增文件**: `src/__test__/pages/Setting/components/SettingHeader.test.tsx`
- **修改文件**: `src/__test__/pages/Setting/SettingPage.test.tsx`（补充 Sidebar 交互测试）
- **依赖**: 复用现有 mock 基础设施（`@/__test__/helpers/mocks`）
- **CI**: 新增测试纳入覆盖率统计，预计模块分支覆盖率从 32.25% 提升到 70%+

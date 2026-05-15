## Why

`ModelHeader.tsx` 是模型创建页面的头部组件，当前行覆盖率仅 3.12%、分支和函数覆盖率均为 0%。根因是 `CreateModel.test.tsx` 仅测试了桌面端（`isMobile=false`），从未触发移动端分支，导致返回按钮、菜单按钮及其交互行为完全未被测试覆盖。

## What Changes

- 为 `ModelHeader` 组件补充完整的单元测试，覆盖移动端和桌面端两种响应式分支
- 测试移动端渲染返回按钮（ArrowLeft）和菜单按钮（Menu）
- 测试点击返回按钮触发 `navigate("/model/table")`
- 测试点击菜单按钮触发 `dispatch(toggleDrawer())`
- 测试桌面端仅渲染标题文本，不显示按钮

## Capabilities

### New Capabilities

- `model-header-testing`: ModelHeader 组件的单元测试，覆盖响应式布局分支和用户交互行为

### Modified Capabilities

（无）

## Impact

- 测试文件：新增 `src/__test__/pages/Model/CreateModel/components/ModelHeader.test.tsx`
- 源代码：无变更
- 依赖：使用现有 mock 基础设施（`useResponsive`、`useNavigate`、`useAppDispatch`）

# 移动端头部返回按钮

## Why

在移动端布局中，模型创建页面的侧边栏（ModelSidebar）被收入抽屉内，导致返回按钮不可见。用户必须先打开抽屉才能返回上一页，增加了操作步骤，影响用户体验。同时，移动端头部区域有足够的空间容纳返回按钮。

## What Changes

- 在 `ModelHeader.tsx` 中添加返回按钮（使用 `ArrowLeft` 图标）
- 返回按钮仅在移动端显示，位于菜单按钮左边
- 点击返回按钮导航到 `/model/table`
- 在 `ModelSidebar.tsx` 中，返回按钮在移动端隐藏（桌面端保持显示）
- 添加适当的 ARIA 标签以支持无障碍访问

## Capabilities

### New Capabilities
_无 - 这是特定页面的 UI 优化，不涉及新的系统级能力_

### Modified Capabilities
_无 - 不修改现有规范的需求，仅调整实现细节_

## Impact

**受影响的文件：**
- `src/pages/Model/CreateModel/components/ModelHeader.tsx`
  - 添加 `useNavigate` hook
  - 添加 `ArrowLeft` 图标导入
  - 在移动端渲染返回按钮
- `src/pages/Model/CreateModel/components/ModelSidebar.tsx`
  - 返回按钮添加条件渲染（仅在桌面端显示）

**依赖：**
- 现有路由系统（`react-router-dom`）
- 现有响应式系统（`useResponsive` hook）
- Lucide React 图标库（`ArrowLeft` 组件）

**用户体验改进：**
- 移动端用户可以直接从头部返回，无需打开抽屉
- 减少一次点击操作
- 符合移动端导航习惯

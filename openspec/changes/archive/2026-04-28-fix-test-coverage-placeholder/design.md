## Context

`Placeholder` 组件位于 `src/pages/Chat/components/Placeholder/index.tsx`，是聊天页面无选中对话时的占位界面。组件通过 `useResponsive()` hook 获取 `isMobile` 状态，在移动端渲染两个操作按钮（打开侧边栏 + 新建聊天），桌面端不渲染按钮。

当前无专门测试文件，仅通过 `ChatPage.test.tsx` 间接渲染，但测试始终 mock 为桌面端模式。

## Goals / Non-Goals

**Goals:**
- 覆盖 `isMobile: true` 和 `isMobile: false` 两种条件渲染分支
- 覆盖 `openDrawer` 回调（`dispatch(toggleDrawer())`）
- 覆盖 `createNewChat` 回调
- 将模块分支覆盖率从 44.44% 提升到 ~100%（排除 t() mock 假阳性）

**Non-Goals:**
- 不修改组件源码
- 不修改 i18n mock 实现
- 不重构现有测试基础设施

## Decisions

**D1: 新建独立测试文件而非扩展现有 ChatPage 测试**

理由：Placeholder 有独立的交互行为（两个按钮、Redux dispatch），与 ChatPage 测试关注点不同。独立文件更易维护，且符合项目现有测试目录结构（每个组件对应一个测试文件）。

**D2: 复用现有 mock 基础设施**

使用 `@/__test__/helpers/mocks` 中的 `mockStore`、`mockUseResponsive` 等工具，不引入新的 mock 模式。通过参数化 `isMobile` 值实现两种场景的切换。

**D3: 测试粒度——渲染验证 + 交互验证**

- 渲染测试：验证桌面端不渲染按钮、移动端渲染两个按钮
- 交互测试：验证 `openDrawer` 触发 `dispatch(toggleDrawer())`、`createNewChat` 被调用
- 不测试样式细节（class name）和翻译文案内容

## Risks / Trade-offs

- **假阳性分支无法消除**：`t()` 翻译函数和 JSX 边界产生的 Istanbul 伪分支（~10 个）无法通过测试消除，但不影响实际覆盖率质量
- **测试与 mock 耦合**：测试依赖 `useResponsive` mock 的返回值结构，若 hook 接口变更需同步更新

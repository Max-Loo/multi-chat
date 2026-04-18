## Why

`KeyManagementSetting` 和 `GeneralSetting` 两个设置页面包含完全相同的滚动容器设置代码：`useAdaptiveScrollbar()` 调用、`useRef` 绑定、`useEffect` 中的 scroll 事件监听。相同模式还出现在 `SettingSidebar` 和 `ToastTest` 中。每新增一个设置页面都需要复制约 10 行相同的样板代码。

## What Changes

- 提取 `useScrollContainer()` hook，封装 `useAdaptiveScrollbar` + `useRef` + scroll 事件监听的完整逻辑
- 返回 `scrollContainerRef`、`scrollbarClassname`，调用方只需绑定 ref 和 class 即可
- 将 `KeyManagementSetting`、`GeneralSetting` 中的重复代码替换为 `useScrollContainer()` 调用

## Capabilities

### New Capabilities
- `scroll-container-hook`: 封装自适应滚动条逻辑的自定义 hook

### Modified Capabilities
<!-- 无既有 spec 的行为变更 -->

## Impact

- **新 hook**：`src/hooks/useScrollContainer.ts` — 新增文件
- **设置页面**：`src/pages/Setting/components/KeyManagementSetting/index.tsx` — 简化滚动容器代码
- **设置页面**：`src/pages/Setting/components/GeneralSetting/index.tsx` — 简化滚动容器代码
- **无运行时行为变更**，仅代码组织优化

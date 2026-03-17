## Why

当前应用初始化过程中只显示一个静态的骨架屏，用户无法感知初始化进度，体验不够直观。当初始化时间较长时，用户可能误以为应用卡死。需要添加一个带进度条和百分比的初始化动画，让用户清楚了解加载状态。

## What Changes

- **新增** Progress UI 组件（基于 shadcn/ui）
- **新增** InitializationController 组件，在 React 组件内执行初始化并管理进度状态
- **重构** main.tsx，将顶层 await 初始化改为 React 组件驱动
- **删除** 旧的静态 InitializationScreen 骨架屏组件

### 进度条 UI 设计

- 使用 shadcn/ui Progress 组件展示线性进度条
- 百分比显示在进度条右侧
- 进度条下方显示 "Initializing application..." + 动态三个点动画（. → .. → ... 循环，每 500ms 更新）
- 初始化完成后等待 0.5s 再进入应用

### 初始化阶段文本策略

- 所有初始化阶段的文本使用英文硬编码
- 不依赖 i18n（因为 i18n 本身是第一个初始化步骤）

## Capabilities

### New Capabilities

- `init-progress-ui`: 初始化进度展示能力，包括进度条、百分比显示、动态加载文本动画

### Modified Capabilities

无。这是纯新增功能，不修改现有 spec 的 requirements。

## Impact

### 代码变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/components/ui/progress.tsx` | 新增 | shadcn/ui Progress 组件 |
| `src/components/InitializationController/index.tsx` | 新增 | 初始化控制器组件 |
| `src/main.tsx` | 重构 | 改为 React 组件驱动的初始化流程 |
| `src/components/InitializationScreen/index.tsx` | 删除 | 旧的静态骨架屏 |

### 依赖变更

- 新增 `@radix-ui/react-progress` 依赖

### 架构变更

初始化流程从顶层 await 改为 React 组件内执行：

```
当前架构:
main.tsx → render(Skeleton) → await init() → render(App)

新架构:
main.tsx → render(App) → App 渲染 InitializationController
         → InitializationController 执行 init() 并更新进度
         → 完成后 App 渲染主应用
```

### 兼容性

- 保持现有的错误处理逻辑（FatalErrorScreen、NoProvidersAvailable）
- 保持现有的警告 Toast 显示逻辑
- 保持现有的安全警告处理逻辑

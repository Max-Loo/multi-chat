## Context

当前 Splitter 组件在 Panel/index.tsx 中被同步导入，导致 `react-resizable-panels` 库被打包进主 bundle。由于 Splitter 功能默认关闭且仅被极少数用户使用，这是不必要的性能开销。

## Goals / Non-Goals

**Goals:**
- 将 Splitter 组件改为异步加载
- 减少主 bundle 体积
- 切换时提供优雅的加载状态

**Non-Goals:**
- 不改变 Splitter 组件的功能行为
- 不添加预加载机制
- 不改变用户交互流程

## Decisions

### 1. 使用 React.lazy + Suspense

**选择**: React.lazy + Suspense

**原因**:
- 内置支持，无需额外依赖
- 实现简单，改动最小
- 与现有 React 19 架构兼容

**备选方案**:
- ~~预加载策略~~: 过度设计，用户使用频率太低不值得
- ~~路由级分割~~: 对于一个小功能来说太重

### 2. Loading 状态使用简化 Skeleton

**选择**: 简化版 Skeleton，与 Splitter 布局一致

**原因**:
- 利用现有 `@/components/ui/skeleton` 组件
- 保持视觉一致性
- 切换加载时间通常 <100ms，简化版足够

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 首次切换有加载延迟 | 使用 Skeleton 提供视觉反馈；延迟通常 <100ms 可接受 |
| 异步加载失败 | React Suspense 的 Error Boundary 机制可捕获处理 |

# Proposal: Chat Content Skeleton Loading

## Why

当前 ChatContent 组件在懒加载 ModelSelect 和 ChatPanel 时使用通用的 FullscreenLoading 组件作为 fallback，该组件仅显示简单的脉冲动画和加载文本，无法反映实际组件的内容结构。这导致用户在等待组件加载时无法预知即将显示的内容布局，降低了用户体验。

## What Changes

- 为 ModelSelect 组件创建专用的骨架屏组件 `ModelSelectSkeleton`，模拟其顶部操作栏和数据表格的结构
- 为 ChatPanel 组件创建专用的骨架屏组件 `ChatPanelSkeleton`，模拟其头部、内容区域和发送框的结构
- 替换 ChatContent 中两处 Suspense 的 fallback 属性，从通用的 FullscreenLoading 改为专用骨架屏组件
- 保持 FullscreenLoading 组件的现有实现，不影响其他使用场景

## Capabilities

### New Capabilities
- `skeleton-loading`: 为懒加载组件提供内容感知的骨架屏加载状态

### Modified Capabilities
- 无现有功能的规格级别变更

## Impact

**受影响的代码：**
- `src/pages/Chat/components/ChatContent/index.tsx` - 替换两处 Suspense fallback
- `src/pages/Chat/components/ChatContent/components/ModelSelect.tsx` - 新增对应的骨架屏组件（建议同目录下创建 `ModelSelectSkeleton.tsx`）
- `src/pages/Chat/components/ChatContent/components/ChatPanel/index.tsx` - 新增对应的骨架屏组件（建议同目录下创建 `ChatPanelSkeleton.tsx`）

**依赖：**
- 使用现有的 shadcn/ui Skeleton 组件（已在 FullscreenLoading 中使用）

**不影响的系统：**
- 不影响现有的加密、存储、模型管理等核心功能
- 不影响 API 交互和数据流

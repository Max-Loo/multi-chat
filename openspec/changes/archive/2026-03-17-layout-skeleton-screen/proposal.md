## Why

当前 `Layout` 组件使用简单的 `Spinner` 作为 Suspense fallback，在页面切换时用户体验单调且缺乏内容预览。骨架屏（Skeleton Screen）能够提供更优雅的加载体验，通过模拟内容结构减少用户的感知等待时间，是现代 UI 设计中的标准实践。

## What Changes

- 创建通用的 `Skeleton` 组件，支持多种骨架屏变体（文本、头像、卡片、列表等）
- 为 `Layout` 组件设计专门的页面级骨架屏，模拟侧边栏和主内容区域结构
- 替换 `Layout` 中 `Suspense` 的 `Spinner` fallback 为新的骨架屏组件
- 骨架屏支持动画效果（脉冲/波浪）以增强视觉反馈
- 所有骨架屏组件支持响应式适配（桌面/移动端）

## Capabilities

### New Capabilities

- `skeleton-screen`: 通用骨架屏组件系统，包含基础骨架元素、复合骨架布局、动画效果和响应式适配

### Modified Capabilities

- （无现有 spec 需要修改）

## Impact

- **受影响文件**：
  - `src/components/Layout/index.tsx` - 替换 Suspense fallback
  - `src/components/ui/skeleton.tsx` - 已存在，作为基础扩展
  - `src/components/Skeleton/` - 新增页面级骨架屏组件目录

- **依赖**：
  - Tailwind CSS（现有）
  - `class-variance-authority`（用于变体样式，如未安装需添加）

- **向后兼容**：完全向后兼容，仅修改内部 loading 展示方式，不对外暴露 API 变更

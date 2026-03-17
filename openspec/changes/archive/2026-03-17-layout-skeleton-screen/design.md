## Context

当前 `Layout` 组件（`src/components/Layout/index.tsx`）使用简单的 `Spinner` 作为 Suspense 的 fallback，在路由懒加载时显示单一的加载指示器。这种方式虽然功能完整，但缺乏内容预览，用户体验不够优雅。

目标是为 Layout 设计一个页面级骨架屏，能够：
1. 模拟实际内容结构，减少用户感知等待时间
2. 支持响应式适配（桌面侧边栏 + 主内容 / 移动端单栏）
3. 提供可复用的骨架屏组件系统

## Goals / Non-Goals

**Goals:**
- 创建通用 Skeleton 组件系统，支持文本、圆形、矩形变体
- 实现 PageSkeleton 组件，专门用于 Layout 的 Suspense fallback
- 支持脉冲和波浪两种动画效果
- 所有组件支持响应式适配
- 替换现有 Spinner fallback

**Non-Goals:**
- 为每个路由创建专门的骨架屏（使用通用 PageSkeleton 即可）
- 深色模式支持（沿用现有设计系统）
- 骨架屏的个性化主题配置

## Decisions

### 1. 组件结构设计

采用分层架构：

```
Skeleton (基础原子组件)
  └─ variant: "text" | "circle" | "rect"
  └─ animation: "pulse" | "wave" | false

PageSkeleton (Layout 专用)
  └─ 桌面端: SidebarSkeleton + MainContentSkeleton
  └─ 移动端: MainContentSkeleton + BottomNav 占位
```

**选择理由**：
- 基础组件足够原子化，可复用于各种场景
- 页面级组件专注 Layout 结构，减少配置复杂度

### 2. 动画实现方案

使用纯 Tailwind CSS 动画类：
- `animate-pulse`：脉冲效果（Tailwind 内置）
- 自定义 `animate-shimmer`：波浪光泽效果

**波浪动画实现**：
在 `tailwind.config.ts` 中扩展动画配置：

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
}
```

Skeleton 组件使用渐变背景 + 动画实现波浪效果：

```tsx
<div className="animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
```

**选择理由**：
- 无需引入额外动画库，保持轻量
- Tailwind 动画与现有设计系统一致
- CSS 动画性能优于 JS 动画

### 3. 样式技术选型

基于现有 `skeleton.tsx` 扩展，保持简洁实现：

```typescript
// 扩展现有 Skeleton 组件，添加 variant 和 animation 支持
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rect';
  animation?: 'pulse' | 'wave' | false;
}

// 使用简单的 cn() 工具组合样式，保持与现有代码一致
const variantStyles = {
  text: 'h-4 w-full rounded-md',
  circle: 'h-10 w-10 rounded-full',
  rect: 'h-24 w-full rounded-md',
};
```

**选择理由**：
- 现有 `skeleton.tsx` 仅使用简单的 `cn()` 工具
- 保持 UI 组件风格一致，不过度设计
- 仅需扩展，无需引入额外依赖

### 4. 响应式适配策略

使用 `useResponsive` hook 检测移动端：

```typescript
const { isMobile } = useResponsive();
```

PageSkeleton 内部根据 `isMobile` 条件渲染不同布局。

**选择理由**：
- 复用现有 hook，保持代码一致性
- 避免媒体查询在 Tailwind 类中过度复杂化

### 5. 集成方式

直接替换 `Layout/index.tsx` 中的 Suspense fallback：

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Outlet />
</Suspense>
```

**选择理由**：
- 最小侵入性修改，仅替换 fallback 组件
- 不需要修改路由配置或其他组件

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 骨架屏与实际内容差异过大 | 保持骨架屏结构简洁，仅展示大致布局轮廓 |
| 动画性能问题 | 使用 CSS 动画，避免 JS 动画；提供禁用动画选项 |
| 移动端适配不完善 | 使用现有 `useResponsive` hook，与 Layout 保持一致 |

## Migration Plan

1. 扩展 `src/components/ui/skeleton.tsx` - 添加 variant 和 animation 支持
2. 创建 `src/components/Skeleton/PageSkeleton.tsx` - 页面级骨架屏
3. 修改 `src/components/Layout/index.tsx` - 替换 Spinner fallback
4. 修改 `tailwind.config.ts` - 添加 shimmer 动画配置
5. 验证桌面端和移动端显示效果

回滚策略：直接恢复 Layout 中的 Spinner fallback 即可。

## Open Questions

- 是否需要为不同路由提供不同的骨架屏变体？（当前方案：使用通用 PageSkeleton）

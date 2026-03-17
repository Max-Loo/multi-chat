## 1. 扩展 Skeleton 组件

- [x] 1.1 分析现有 `src/components/ui/skeleton.tsx` 实现
- [x] 1.2 基于现有组件扩展 `variant` 变体（text/circle/rect）
- [x] 1.3 基于现有组件扩展 `animation` 动画（pulse/wave/false）
- [x] 1.4 添加 TypeScript 类型导出

## 2. 页面级骨架屏组件

- [x] 2.1 创建 `src/components/Skeleton/PageSkeleton.tsx`
- [x] 2.2 实现 SidebarSkeleton 组件（模拟侧边栏结构）
- [x] 2.3 实现 MainContentSkeleton 组件（模拟主内容区域）
- [x] 2.4 实现响应式适配（桌面/移动端不同布局）
- [x] 2.5 实现 SkeletonList 组件（列表骨架）
- [x] 2.6 实现 SkeletonMessage 组件（聊天消息骨架）
- [x] 2.7 添加 index.ts 统一导出

## 3. Layout 集成

- [x] 3.1 修改 `src/components/Layout/index.tsx`
- [x] 3.2 将 Suspense fallback 从 `Spinner` 替换为 `PageSkeleton`
- [x] 3.3 验证路由切换时骨架屏正常显示

## 4. 配置与验证

- [x] 4.1 修改 `tailwind.config.ts` 添加 shimmer 动画配置
- [x] 4.2 桌面端验证骨架屏显示效果
- [x] 4.3 移动端验证骨架屏显示效果
- [x] 4.4 验证动画效果（脉冲/波浪）
- [x] 4.5 确保无 TypeScript 类型错误

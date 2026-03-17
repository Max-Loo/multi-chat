# Canvas 动态 Logo - 机器人思考打字动画

## Why

当前初始化页面使用简单的 Skeleton 加载动画，缺乏品牌识别度和视觉吸引力。作为一个多模型 AI 聊天应用，需要一个能传达"智能思考"和"内容创作"概念的动态 Logo，提升首次启动体验并强化品牌形象。

## What Changes

- **新增** Canvas 绘制的动态机器人 Logo 组件（用于初始化页面）
- **新增** 静态 SVG 图标文件（用于 App 图标、favicon）
- **新增** 机器人思考打字场景动画（10+ 动画元素）
- **修改** 初始化页面 `InitializationScreen` 组件，替换现有 Skeleton
- **修改** 应用图标文件 `public/logo.svg`
- **新增** 动画性能优化逻辑（prefers-reduced-motion 支持）

## Capabilities

### New Capabilities

- `animated-logo`: Canvas 动态 Logo 组件，展示机器人思考打字场景动画（初始化页面使用）
- `app-icon`: 静态 SVG 应用图标，基于相同设计风格的简化版本（App 图标、favicon 使用）

### Modified Capabilities

无现有能力的需求变更。

## Impact

### 受影响的文件

| 文件 | 变更类型 |
|------|---------|
| `src/components/InitializationScreen/index.tsx` | 修改 |
| `src/components/InitializationScreen/AnimatedLogo.tsx` | 新增 |
| `src/components/InitializationScreen/canvas-logo.ts` | 新增 |
| `public/logo.svg` | 修改（替换为新设计） |

### 两种输出形式的关系

```
┌─────────────────────────────────────────────────────────────┐
│                    统一设计语言                              │
│                （极简机器人 + 打字姿态）                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐       ┌─────────────────┐             │
│  │  Canvas 动画    │       │   SVG 图标      │             │
│  │  (初始化页面)    │       │  (App 图标)     │             │
│  │                 │       │                 │             │
│  │  • 10+ 动画元素  │       │  • 静态简化版   │             │
│  │  • 完整场景     │       │  • 核心元素     │             │
│  │  • 思考气泡动画  │       │  • 适合小尺寸   │             │
│  └─────────────────┘       └─────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 依赖

- 无新增外部依赖
- Canvas 动画使用浏览器原生 Canvas API
- SVG 图标为纯矢量图形文件

### 性能考虑

- 动画使用 `requestAnimationFrame` 实现 60fps 流畅度
- 支持 `prefers-reduced-motion` 媒体查询，为需要减少动画的用户提供静态版本
- 组件卸载时清理动画帧，避免内存泄漏

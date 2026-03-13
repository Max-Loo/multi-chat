## Context

当前 `ChatPanelContent` 组件支持两种布局模式：
1. **可拖拽分屏模式** - 使用 `ResizablePanelGroup`，适合桌面端
2. **固定棋盘模式** - 使用 flex 布局，按 `columnCount` 分割

这两种模式在移动端（<768px）体验较差：屏幕空间有限，拖拽操作困难，每个聊天区域过窄。

项目已有 `useResponsive` hook，提供 `isMobile` 判断（<768px）。需要新增屏幕方向检测能力。

## Goals / Non-Goals

**Goals:**
- 移动端采用"主聊天 + 副聊天"布局，提升移动端多模型聊天体验
- 竖屏时副聊天在上方水平排列，横屏时在左侧垂直排列
- 点击副聊天可切换为主聊天
- 复用 `ChatPanelContentDetail` 组件渲染副聊天内容

**Non-Goals:**
- 本迭代不实现切换动画（后续迭代添加）
- 不改变桌面端现有逻辑
- 不改变桌面端 `columnCount` 和 `isSplitter` 的现有行为

**移动端对现有 Props 的处理:**
- 移动端模式下**忽略** `columnCount` 和 `isSplitter` props，强制使用主副分屏布局
- 相关控制 UI（如 `ChatPanelHeader` 中的分屏设置）应在移动端隐藏（由父组件/头部组件处理，不在本组件范围内）

## Decisions

### 1. 主聊天状态管理位置

**决策**: 在 `ChatPanelContent` 组件内部管理 `primaryModelId` 状态

**理由**:
- 这是移动端特有的状态，不影响父组件或其他组件
- 避免向 `ChatPanel` 传递额外的 props 和回调
- 保持组件内聚性

**备选方案**:
- 在 `ChatPanel` 中管理状态 → 会增加父子组件耦合，且该状态仅在移动端布局中使用

### 2. 屏幕方向检测

**决策**: 创建新的 `useOrientation` hook

**理由**:
- `useResponsive` 只检测屏幕宽度，不检测方向
- 屏幕方向检测逻辑独立，便于复用和测试
- 可基于现有的 `useMediaQuery` 实现

**实现**:
```typescript
type Orientation = 'portrait' | 'landscape';

function useOrientation(): Orientation {
  const isPortrait = useMediaQuery('(orientation: portrait)', true);
  return isPortrait ? 'portrait' : 'landscape';
}
```

### 3. 副聊天布局计算

**决策**: 副聊天保持宽高比一致，根据可用空间自适应大小

**布局规则**:
- **竖屏**: 副聊天在主聊天上方，水平排列
  - 副聊天高度 = 可用高度 / (副聊天数量 + 1) * 0.3 (约30%给副聊天)
  - 每个副聊天宽度相等
- **横屏**: 副聊天在主聊天左侧，垂直排列
  - 副聊天宽度 = 可用宽度 / (副聊天数量 + 1) * 0.3 (约30%给副聊天)
  - 每个副聊天高度相等

**理由**: 保持宽高比一致，让副聊天内容可读性更好

### 4. 组件结构

**决策**: 不创建独立的 `MobileSplitLayout` 组件，直接在 `ChatPanelContent` 中条件渲染

**理由**:
- 逻辑相对简单，不需要额外的组件层级
- 减少文件数量
- 保持现有组件 API 不变

### 5. 副聊天滚动位置临时保存

**决策**: 使用 `Map<modelId, scrollPosition>` 在组件内临时保存各副聊天的滚动位置

**理由**:
- 用户在副聊天中阅读长内容时，切换主聊天不应丢失阅读进度
- 内存保存成本极低，不需要持久化
- 实现简单，可随组件卸载自动清理

**实现**:
```typescript
const scrollPositionsRef = useRef<Map<string, number>>(new Map());
// 副聊天滚动时保存位置
// 切换为主聊天时恢复位置
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 副聊天区域过小导致内容不可读 | 设置最小尺寸阈值，过小时降级为 Tab 模式 |
| 频繁切换屏幕方向导致状态丢失 | 使用 `modelId` 而非索引作为 `primaryModelId`，状态不受重新渲染影响 |
| 副聊天滚动位置丢失 | 本迭代不处理，后续可考虑持久化滚动位置 |

## Migration Plan

1. 添加 `useOrientation` hook
2. 修改 `ChatPanelContent` 组件，添加移动端分支逻辑
3. 测试移动端布局在竖屏和横屏下的表现

**回滚策略**: 移除移动端分支逻辑，恢复原有渲染路径

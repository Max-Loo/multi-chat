## Why

聊天消息列表和侧边栏对话列表当前使用 `.map()` 全量渲染 DOM。虽然单次对话通常不超过 50 条消息，但单条消息可能包含大量代码（highlight.js 产生数千 DOM 节点），多面板模式下 DOM 压力成倍增长。引入虚拟滚动可以只渲染可视区域内的消息，显著降低 DOM 节点数量和内存占用，提升长对话和多面板场景下的流畅度。

## What Changes

- 引入 [virtua](https://github.com/inokawa/virtua) 作为虚拟滚动库（~3kB gzip，零配置，支持动态高度和反向滚动）
- 将聊天消息列表（`Detail` 组件）从 `.map()` 全量渲染改为 `VList` 虚拟化渲染
- 将侧边栏对话列表（`Sidebar` 组件）从 `.map()` 全量渲染改为 `VList` 虚拟化渲染
- 适配现有的自动滚到底部、滚动条自适应、"回到底部"按钮等交互逻辑
- 对 `ChatBubble` 组件添加 `React.memo`，配合虚拟化减少不必要的重渲染
- 收窄 `RunningBubble` 的 Redux selector，从订阅整个 `runningChat` 改为只订阅当前面板所需的数据（RunningBubble 已有 memo 包裹，无需重复添加）

## Capabilities

### New Capabilities
- `virtual-scroll`: 聊天消息列表和侧边栏对话列表的虚拟滚动能力，基于 virtua 库实现，包含动态高度测量、自动跟随底部、滚动位置恢复等行为规范

### Modified Capabilities

（无需修改现有 spec 的需求层行为）

## Impact

- **新增依赖**：`virtua`（~3kB gzip）
- **核心改动文件**：
  - `src/pages/Chat/components/Panel/Detail/index.tsx` — 消息列表虚拟化
  - `src/pages/Chat/components/Sidebar/index.tsx` — 对话列表虚拟化
  - `src/components/chat/ChatBubble.tsx` — 添加 memo
  - `src/pages/Chat/components/Panel/Detail/RunningBubble.tsx` — 收窄 selector（已有 memo）
- **需适配的现有行为**：
  - 自动滚到底部逻辑（`scrollToBottom` + `isAtBottom`）
  - 滚动条自适应显示/隐藏（`useAdaptiveScrollbar`）
  - ResizeObserver 监听内容变化
  - 流式生成中消息的追加渲染
- **Vite 构建**：`virtua`（~3kB gzip）将归入通用 `vendor` chunk，无需单独分组

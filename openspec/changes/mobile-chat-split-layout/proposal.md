## Why

当前移动端的聊天分屏布局（可拖拽 Resizer 和固定棋盘模式）在窄屏上体验差，用户难以同时关注多个模型的回复。无法高效对比不同模型的输出。需要一个更适合移动端的"主聊天 + 副聊天"布局模式，让用户可以专注于一个聊天的同时，通过缩小视图监控其他聊天的进展。

## What Changes
- 在 `ChatPanelContent` 组件中添加移动端检测逻辑
- 移动端时，根据屏幕方向（竖屏/横屏）渲染"主聊天 + 副聊天"布局
- 主聊天占据主要空间（约 70%），完整展示内容，支持全部交互
- 副聊天以缩小的比例（约 30%）展示在主聊天周围（竖屏在上方，横屏在左侧）
- 点击副聊天可将其与主聊天交换位置
- 只有一个聊天时，正常全屏展示
- 非移动端时保持现有逻辑不变
- **移动端时忽略 `columnCount` 和 `isSplitter` props**（不改变父组件行为，仅在本组件内部处理）
## capabilities
### New capabilities
- `mobile-chat-split-layout`: 移动端聊天的主副分屏布局能力，支持主/副聊天切换、屏幕方向自适应

### modified capabilities
- `chat-panel-content`: 修改渲染逻辑以支持移动端场景

## impact
- **代码**:
  - `src/pages/Chat/components/ChatContent/components/ChatPanel/components/ChatPanelContent/index.tsx` (主要修改)
  - 新增 `src/hooks/useOrientation.ts` (屏幕方向检测)
- **依赖**:
  - `useResponsive` hook (已有)
  - `ChatPanelContentDetail` 组件 (复用)
- **UI 组件**: 无新增依赖

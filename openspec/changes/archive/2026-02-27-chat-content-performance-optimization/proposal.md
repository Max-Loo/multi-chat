# ChatContent 性能优化提案

## Why

ChatContent 组件即使在未选中任何聊天的情况下也会导致页面渲染耗时过长。这是因为 ChatContent 在模块顶部静态导入了 ChatPanel 和 ModelSelect 组件，而 ChatPanel 的依赖链包含多个大型库（highlight.js ~76KB、markdown-it ~121KB、dompurify ~30KB），这些库在模块加载时就会被导入，即使 ChatPanel 从未被渲染。这造成了不必要的初始加载延迟和内存占用。

## What Changes

- 将 ChatPanel 组件从静态导入改为使用 React.lazy() 动态导入
- 将 ModelSelect 组件从静态导入改为使用 React.lazy() 动态导入
- 在 ChatContent 中添加 React.Suspense 边界，使用 FullscreenLoading 作为 fallback 组件
- 保持所有现有功能和用户交互不变，仅改变组件加载时机

## Capabilities

### New Capabilities
- `lazy-chat-panel`: 聊天面板组件的按需加载能力，确保大型依赖仅在需要时加载

### Modified Capabilities
- 无

## Impact

- **受影响的代码**:
  - `src/pages/Chat/components/ChatContent/index.tsx` - 修改导入方式和添加 Suspense 边界
- **受影响的组件**:
  - ChatPanel - 将被动态加载
  - ModelSelect - 将被动态加载
- **构建产物变化**:
  - ChatPanel 及其依赖将被分割到独立的 chunk 文件
  - ModelSelect 及其依赖将被分割到独立的 chunk 文件
- **性能影响**:
  - 减少初始加载体积约 200KB+
  - 提升未选中聊天时的渲染速度
  - 首次选中聊天时会有短暂的加载延迟（由 FullscreenLoading 掩盖）
  - 后续切换聊天时组件会被缓存，无重复加载
- **依赖变化**:
  - 无新增依赖
  - 现有依赖的使用方式不变

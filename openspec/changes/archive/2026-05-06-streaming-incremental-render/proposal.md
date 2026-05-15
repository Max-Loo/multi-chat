## Why

流式 AI 回复期间，每 ~50ms 会触发一次完整的 markdown → HTML 重解析和 `innerHTML` 全量替换。随着消息内容增长，已渲染的段落和代码块被反复销毁重建，造成不必要的 CPU 和 DOM 操作开销。对于长消息（数千字），性能退化明显。

## What Changes

- 引入「冻结/活跃」分割渲染机制：流式内容在安全的段落边界处切分为已确认的冻结块和正在接收的活跃块
- 冻结块一旦生成 HTML 后不再变化，活跃块每次 tick 重新渲染（内容短，开销小）
- 新增 `StreamingContent` 组件封装分割逻辑，替代 ChatBubble 内部直接使用 `dangerouslySetInnerHTML`
- 流式结束后执行一次完整渲染作为最终校正，确保视觉正确性
- ThinkingSection 同样应用此优化

## Capabilities

### New Capabilities
- `streaming-content-render`: 流式消息的增量渲染能力，包含安全分割点检测、冻结块 append-only 缓存、流式/非流式切换

### Modified Capabilities
（无现有 spec 需要修改，这是纯新增的渲染优化，不影响对外接口）

## Impact

- **新增文件**: `src/components/chat/StreamingContent.tsx`
- **修改文件**: `src/components/chat/ChatBubble.tsx`（替换 `dangerouslySetInnerHTML` 为 `StreamingContent`）、`src/components/chat/ThinkingSection.tsx`（同上）
- **不受影响**: `src/utils/markdown.ts`（`generateCleanHtml` 接口不变）、`src/utils/codeBlockUpdater.ts`（全局搜索机制兼容）、父组件 Detail、Redux store、流式处理器
- **无依赖变更**

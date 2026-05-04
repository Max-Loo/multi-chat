## Why

流式响应期间，点击「滚动到底部」按钮无效。根因是 RunningBubble 渲染在 Virtualizer 外部，而 `scrollToBottom` 使用 `scrollToIndex` 只能操作 Virtualizer 内的元素，无法到达外部正在生成的流式内容。RunningBubble 放在外部并非有意设计，而是引入 Virtualizer 时遗留的疏忽。

## What Changes

- 将流式消息（当前由 RunningBubble 渲染）纳入 Virtualizer 内部，作为历史列表的最后一项统一管理
- 构造合并列表 `displayList = [...historyList, runningMessage?]`，让 `scrollToIndex` 能精确滚到真正的底部
- 删除 `RunningBubble.tsx` 组件，其 loading spinner 逻辑迁移到 Virtualizer 渲染逻辑中
- 消除 `scrollToBottom` 的坐标系分裂问题，滚动逻辑不再需要区分流式/非流式两种模式

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `virtual-scroll`：RunningBubble 不再独立于 Virtualizer 外部，改为作为 Virtualizer 内部的动态最后一项；`scrollToBottom` 在流式期间同样使用 `scrollToIndex` 即可到达底部
- `scroll-status-manager`：`scrollToBottom` 不再需要通过 `historyLengthRef` 间接读取长度，改为读取包含流式消息的合并列表长度

## Impact

- **核心文件**：`src/pages/Chat/components/Panel/Detail/index.tsx`（合并列表构造、渲染逻辑、scrollToBottom 简化）
- **删除文件**：`src/pages/Chat/components/Panel/Detail/RunningBubble.tsx`
- **无影响**：Redux 数据流（`chatSlices.ts`）、流式处理（`streamProcessor.ts`）、`ChatBubble` 组件
- **兼容性**：`scrollToBottom` 对外行为不变（仍滚到底部），只是内部实现统一为单一坐标系

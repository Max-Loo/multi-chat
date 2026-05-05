## Why

ChatBubble 的操作栏布局存在两个体验问题：用户消息的操作按钮嵌套在气泡色块内部显得拥挤，且翻页器与操作栏分占两行浪费空间。AI 消息的翻页器与用户消息联动机制不够直观——AI 独立翻页会与用户消息版本错位。此外，重新生成采用追加策略导致 AI content 数组长度不受控，无法与用户编辑版本精确对应。AI 消息在流式生成期间提前展示操作栏也影响视觉整洁度。

## What Changes

- **修改** 用户消息气泡布局：操作栏和翻页器从气泡色块内部移到外部独立行，右下角对齐
- **修改** 翻页器与操作栏合并为同一行：操作按钮在左，翻页器在右侧
- **修改** AI 消息移除独立翻页器：AI 消息的版本展示完全由配对的用户消息翻页器控制
- **修改** AI 消息生成中隐藏操作栏：仅在 `isRunning === false` 时显示操作工具栏
- **修改** 重新生成策略为覆盖模式：`commitRegenerate` 原地覆盖当前版本而非追加新版本，`rollbackRegenerate` 从暂存恢复旧内容；同时覆盖 `reasoningContent`

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `message-operations`: 重新生成策略从追加改为覆盖（content 和 reasoningContent 同时覆盖），AI 消息生成中隐藏操作栏，AI 消息移除独立翻页器，用户消息操作栏布局独立于气泡色块并与翻页器合并同一行

## Impact

- **修改文件**：
  - `src/components/chat/ChatBubble.tsx` — 用户/AI 气泡布局重构、操作栏显示逻辑、翻页器位置变更
  - `src/services/chat/chatHistoryHelper.ts` — `commitRegenerate` 和 `rollbackRegenerate` 逻辑变更
  - `src/store/slices/chatSlices.ts` — `runningChat` 类型增加回滚暂存字段，thunk 适配覆盖逻辑
  - `src/types/chat.ts` — `RunningChatEntry` 类型增加回滚暂存字段
- **依赖变更**：无
- **Breaking**：无（纯内部行为变更，不影响外部接口）

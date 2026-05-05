## Context

ChatBubble 组件当前的操作栏和翻页器嵌套在气泡色块内部，布局拥挤。AI 消息独立拥有翻页器，但其 content 数组版本与用户消息存在联动关系。重新生成 AI 回复采用追加策略（pushContent），导致 AI 的 content 数组长度可能超过用户消息，翻页时出现版本错位。

当前相关架构：
- `ChatBubble.tsx`：USER 和 ASSISTANT 两个 case 各自渲染 `ActionToolbar` 和 `HistoryPager`
- `Detail/index.tsx`：`pairHistoryIndices` 状态管理配对消息的翻页同步
- `chatHistoryHelper.ts`：`commitRegenerate` 使用 `pushContent` 追加新版本，`rollbackRegenerate` 使用 `popContent` 回滚
- `chatSlices.ts`：`runningChat[chatId][modelId]` 存储发送状态（`{ isSending, history, errorMessage }`）

## Goals / Non-Goals

**Goals:**

- 用户消息操作栏独立于气泡色块，与翻页器合并为单行右对齐
- AI 消息不显示独立翻页器，版本完全由配对用户消息控制
- AI 消息生成中不显示操作栏
- 重新生成为覆盖策略，保证用户和 AI 的 content 数组长度始终一致
- 回滚机制可靠恢复被覆盖的内容

**Non-Goals:**

- 不改变编辑用户消息的数据流（仍然是 push 策略）
- 不改变 `Detail/index.tsx` 的配对逻辑（`pairHistoryIndices` 机制不变）
- 不引入新的外部依赖

## Decisions

### 1. 用户消息操作栏布局：外置独立行

将 `ActionToolbar` 和 `HistoryPager` 从 `<Card>` 内部移出，放在 Card 外的独立 flex 容器中。整体结构：

```
<div className="flex flex-col items-end max-w-[80%]">
  <Card>...</Card>                    {/* 气泡内容 */}
  <div className="flex items-center gap-1 mt-1">
    <ActionToolbar />                 {/* 操作按钮 */}
    <HistoryPager />                  {/* 翻页器，靠右 */}
  </div>
</div>
```

**备选方案**：使用 `Card` 的 `footer` slot — 放弃，因为 Card 无 footer slot，且会导致操作栏仍受 Card 样式影响。

### 2. 重新生成覆盖策略：原地替换 + 暂存回滚

`commitRegenerate` 改为原地覆盖当前 AI content 和 reasoningContent 的最后一个元素为空字符串（而非 push 新元素）。被覆盖的旧值暂存在 `runningChat` 状态中。

`runningChat` 类型扩展：
```typescript
interface RunningChatEntry {
  isSending: boolean;
  history: ChatHistoryItem[];
  errorMessage?: string;
  rollbackContent?: string;           // 新增：被覆盖的 content
  rollbackReasoningContent?: string;  // 新增：被覆盖的 reasoningContent
}
```

数据流（注意执行顺序，runningChat 条目必须先于 commitRegenerate 创建）：
```
thunk 执行顺序：
  1. 为每个启用模型 dispatch(editRegenerateInit)  ← 先创建 runningChat[chatId][modelId] 条目
  2. dispatch(commitRegenerate)                    ← 此时已有条目，可写入回滚字段
  3. Promise.all: 流式生成...

commitRegenerate:
  1. 暂存 AI message content 最后一个元素到 runningChat[chatId][modelId].rollbackContent
  2. 暂存 reasoningContent 最后一个元素到 runningChat[chatId][modelId].rollbackReasoningContent
  3. 将 content 最后一个元素设为 ''
  4. 将 reasoningContent 最后一个元素设为 ''

rollbackRegenerate:
  1. 从 runningChat[chatId][modelId].rollbackContent 恢复 content 最后一个元素
  2. 从 runningChat[chatId][modelId].rollbackReasoningContent 恢复 reasoningContent 最后一个元素
  3. 清除回滚字段

updateHistoryContent:
  逻辑不变，仍然替换 content 最后一个元素为实际结果
```

**备选方案**：
- A. 保持 push 但完成后合并（pop 旧值保留新值）— 增加完成回调的复杂度
- B. 使用独立 Map 暂存 — 多一个内存管理点

选择 runningChat 方案（当前方案），因为暂存数据的生命周期与发送状态完全一致，发送结束自动清理。

### 3. AI 消息生成中隐藏操作栏

在 ASSISTANT case 的 `showActions` 判断中增加 `!isRunning` 条件。用户消息不受影响（用户消息没有 `isRunning` 为 true 的场景）。

### 4. AI 消息移除翻页器

直接移除 ASSISTANT case 中的 `<HistoryPager>` 渲染。AI 消息的 `historyIndex` 仍然通过 `historyIndexOverride` 由父组件控制，只是不再提供独立的翻页 UI。

## Risks / Trade-offs

- **[覆盖不可逆]** 覆盖策略意味着重新生成后旧版本不可通过翻页找回（除非回滚） → 这是用户期望的行为，编辑历史仅由用户编辑产生
- **[暂存丢失]** 如果应用在重新生成过程中崩溃，rollback 数据丢失，AI 消息可能停留在空字符串状态 → 已有机制：重启后 runningChat 不持久化，用户可手动编辑触发新一轮生成
- **[多模型一致性]** `commitRegenerate` 需要为每个 modelId 独立暂存回滚数据 → `runningChat[chatId][modelId]` 结构天然支持按模型暂存

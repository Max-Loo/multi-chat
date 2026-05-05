## Context

当前重新生成（regenerate）流程中，`commitRegenerate` / `rollbackRegenerate` / `updateHistoryContent` 三个 helper 函数始终操作 content 数组的最后一个元素（`arr[arr.length - 1]`）。`onRegenerate` 回调仅传递 `messageId`，不携带当前翻页器的 `historyIndex`。`regenerateMessage` thunk 中提取用户消息作为 API prompt 时也使用 `getCurrentContent()`（取最新版本）。

这意味着无论用户翻到哪个历史版本，重新生成总是覆盖最新版本，并发送最新用户消息作为 prompt。

## Goals / Non-Goals

**Goals:**

- 将 `historyIndex` 从 ChatBubble → Detail → thunk → helper 全链路传递
- helper 函数按 `historyIndex` 定位操作的数组元素，而非固定末尾
- API prompt 使用用户消息的对应历史版本
- 向后兼容：不传 `historyIndex` 时行为与当前一致（默认操作最后一个元素）

**Non-Goals:**

- 不引入分支/树状历史结构
- 不改变编辑（edit）流程的行为
- 不修改翻页器 UI
- 修改 `pairHistoryIndices` 的 reset effect，使其仅在 content 数组长度增长时重置索引（原地覆盖不改变长度，不触发重置）

## Decisions

### D1: historyIndex 在 helper 层设为可选参数，默认取数组末尾

`commitRegenerate(state, chatId, assistantMessageId, historyIndex?)` 中 `historyIndex` 默认为 `Array.isArray(content) ? content.length - 1 : undefined`（即操作最后一个元素）。

**理由**：向后兼容，现有调用点无需修改即可保持原有行为。

**替代方案**：historyIndex 必填——会导致所有现有调用点都要传参，改动面更大。

### D2: historyIndex 由 ChatBubble 内部 state 提供，通过回调链向上传递

ChatBubble 已有 `historyIndex`（来自 `historyIndexOverride` 或 `internalHistoryIndex`），只需在 `onRegenerate` 回调中追加该参数。

**理由**：不需要新增 state，复用现有翻页器索引。

### D3: API prompt 按对应 historyIndex 提取用户消息

`regenerateMessage` thunk 中将 `historyIndex` 传递给用户消息的 content 提取逻辑：`Array.isArray(content) ? content[historyIndex] : content`。

**理由**：用户浏览的是配对的历史版本（用户消息 v1 + AI 回复 v1），重新生成应基于该版本的用户消息。

### D4: reset effect 改为追踪 content 数组长度，仅长度增长时重置

当前 reset effect（`Detail/index.tsx:131-146`）依赖 `displayList` 引用变化触发，内部检查 `prev[id] !== content.length - 1` 来决定是否重置。原地覆盖（regenerate）虽然不改变数组长度，但 `commitRegenerate` 中 `[...aiMessage.content]` 展开创建新数组引用，经 Immer 传播导致 `displayList` 重算，effect 照样触发并将非最新版本的索引重置到最新。

修复方式：使用 `useRef<Record<string, number>>` 追踪每条消息的上一次 `content.length`，仅在 `newLength > prevLength` 时重置。首次出现（`prevLength === undefined`）不重置，由 ChatBubble 自身的 reset effect 处理。

**理由**：精准区分"编辑推送新版本"（需重置）与"原地覆盖"（不应重置），无需引入额外标记状态。

**替代方案**：使用 `regeneratingIds` 标记集合——需要追踪重新生成的开始和结束时机，增加组件与 thunk 之间的耦合。

## Risks / Trade-offs

- **[historyIndex 越界]** → helper 函数中对 `historyIndex` 做 clamp：`Math.min(historyIndex, arr.length - 1)`，防止数组长度变化导致越界
- **[多模型 historyIndex 不一致]** → 当前设计中所有模型共享同一个 historyIndex，因为它们的 content 数组结构一致（编辑/重新生成时所有模型同步 push）。如果未来某个模型的 content 数组长度不同，需要按模型分别取 index。当前阶段风险极低。

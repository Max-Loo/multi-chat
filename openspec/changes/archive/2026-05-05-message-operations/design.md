## Context

当前 ChatBubble 是纯展示组件（`memo(ChatBubbleInner, arePropsEqual)`），接收 `role`/`content`/`reasoningContent`/`isRunning` 四个只读 props，无任何交互回调。消息数据流为单向：Sender → chatSlices.sendMessage → streamChatCompletion → pushRunningChatHistory → ChatBubble 渲染。chatSlices 中仅有整聊天的增删改（`createChat`/`editChat`/`deleteChat`）和追加消息（`pushChatHistory`/`appendHistoryToModel`），无单条消息级别的操作。

核心约束：
- `activeChatData` 按需加载，`chatModelList` 中的 `chatHistoryList` 是消息的唯一数据源
- 多模型并发时，每个 ChatModel 有独立的 `chatHistoryList`，**用户消息 ID 和 AI 回复 ID 在各模型间均不相同**（由 `sendMessage` 分别生成）
- 编辑/重新生成操作需通过**位置索引**（而非 messageId）跨模型定位对应消息
- `runningChat` 存储流式临时数据，完成前不应执行编辑/重新生成
- ChatBubble 使用 `Virtualizer` 虚拟化渲染，操作栏不能破坏虚拟化性能

## Goals / Non-Goals

**Goals:**
- 在消息气泡上提供复制、编辑、重新生成三种操作
- 仅允许编辑最新一条用户消息，编辑后重新生成对应的最新 AI 回复
- 保留编辑历史，UI 支持翻页查看历史版本
- 重新生成最后一条 AI 回复时，对所有启用的模型重新调用流式聊天
- 所有消息操作通过 Redux action → middleware 持久化
- 操作栏在虚拟化环境中保持性能

**Non-Goals:**
- 不支持删除消息
- 不支持编辑 AI 回复内容（AI 回复只能重新生成）
- 不支持编辑非最新用户消息
- 不支持批量消息操作
- 不支持消息撤回/恢复
- 不实现拖拽排序消息

## Decisions

### 决策 1：操作栏的触发方式

**选择**：操作栏始终可见，固定展示在气泡左下角

所有消息的操作栏始终可见，无需 hover 触发。按钮使用纯图标，hover 图标时通过 tooltip 显示文字描述。操作栏统一固定在气泡左下角（用户消息和 AI 消息均如此）。

**替代方案**：hover 显示 → 被否决，功能发现成本高，移动端无 hover 事件。

**替代方案**：右键菜单 → 被否决，移动端无右键，且多了一步操作。

**替代方案**：长按触发 → 被否决，与滚动操作冲突，且用户发现成本高。

**理由**：始终可见的操作栏确保用户能第一时间发现消息操作能力，降低功能发现成本。纯图标 + tooltip 的方式在保持信息密度的同时提供必要的文字提示。

### 决策 2：编辑消息的范围和交互

**选择**：仅允许编辑最新一条用户消息，行内编辑，保留历史版本

1. 仅最新一条用户消息显示编辑按钮
2. 用户点击编辑按钮 → ChatBubble 进入编辑模式，气泡内容替换为 `<Textarea>`，预填当前消息文本
3. 用户修改内容后按 Enter 或点击确认 → dispatch `editAndResendMessage`
4. 该 action 做以下事情（原子操作）：
   a. 通过位置索引定位所有 ChatModel 中对应用户消息和 AI 回复
   b. 用户消息：旧 `content` push 进数组，新内容设为数组最后一个元素
   c. AI 回复（若存在）：旧 `content` 和 `reasoningContent` push 进各自数组，追加空字符串占位
   d. 对每个 ChatModel 重新调用 `streamChatCompletion`
5. 重新生成完成后：AI 回复数组最后一个元素（占位空字符串）替换为实际生成结果
6. 重新生成失败时：调用 `rollbackEdit` 回滚用户消息和 AI 回复的数组
7. 取消编辑 → 恢复原始气泡展示

**替代方案**：弹出对话框编辑 → 被否决，打断对话流，且需要额外的对话框状态管理。

**替代方案**：编辑后截断后续对话 → 被否决，只重新生成对应 AI 回复即可，无需丢失后续对话。

**理由**：行内编辑在上下文中直接完成，用户感知更连贯。限制为最新消息确保上下文一致性，保留历史版本让用户可以回顾编辑过程。

### 决策 3：重新生成的范围

**选择**：重新生成最后一条 AI 回复，对所有启用的模型生效

重新生成按钮只出现在对话中最后一条 `role === 'assistant'` 的消息上。点击后：
1. 通过位置索引定位所有 ChatModel 中的 AI 回复消息
2. 旧 `content` 和 `reasoningContent` push 进数组，追加空字符串占位
3. 对每个 ChatModel，使用该消息之前的对话历史重新调用 `streamChatCompletion`
4. 新回复填充到数组末尾（替换占位空字符串）
5. 重新生成失败时：调用 `rollbackRegenerate` 回滚 AI 回复数组

**替代方案**：仅重新生成当前查看模型的回复 → 被否决，多模型场景下用户期望所有模型同步更新。

**替代方案**：支持重新生成任意位置的 AI 回复 → 被否决，中间消息重新生成会导致后续对话上下文不一致。

**理由**：与编辑后重新生成的行为一致（都作用于所有启用模型），只有最后一条 AI 回复的重新生成在语义上是安全的。

### 决策 4：编辑历史的数据结构

**选择**：`content` 和 `reasoningContent` 类型改为 `string | string[]`

```typescript
interface StandardMessage {
  // ...现有字段
  content: string | string[];           // string = 未编辑，string[] = 有历史（最后一个元素为当前版本）
  reasoningContent?: string | string[]; // 同上，与 content 数组长度一致
}
```

- `string`：从未被编辑过（向后兼容）
- `string[]`：有编辑历史，最后一个元素始终是当前版本
- `buildMessages` 发送给 AI 时取数组最后一个元素
- 翻页浏览时，用户消息和 AI 回复通过数组下标一一对应
- `commitEdit` 和 `commitRegenerate` 在同一个 Redux action 中原子性更新，保证用户消息和 AI 回复数组**长度始终一致**（包括首次编辑：AI 回复也追加空字符串占位）
- 重新生成失败时通过 `rollbackEdit` / `rollbackRegenerate` 回滚数组，恢复一致性

**替代方案**：新增 `editHistory` 可选字段 → 被否决，混合职责，`StandardMessage` 语义从"一条消息"变为"消息+历史容器"。

**替代方案**：在 Chat 层级维护独立的 `messageVersions` 映射 → 被否决，引入额外的数据管理复杂度，交叉引用增加开发成本。

**理由**：`string | string[]` 是最小改动方案。TypeScript 类型检查确保所有消费端正确处理联合类型。向后兼容（`string` 不变），不增加新字段，消费端通过 helper 函数统一获取当前版本。

### 决策 5：跨模型消息定位策略

**选择**：通过位置索引定位，而非消息 ID

由于 `startSendChatMessage` 对每个 ChatModel 分别 dispatch `sendMessage`，每个模型生成独立的用户消息 ID 和 AI 回复 ID。因此无法通过单个 messageId 跨模型定位消息。

定位流程：
1. UI 传入当前查看模型的用户消息 ID（或 AI 回复 ID）
2. 在该模型的 `chatHistoryList` 中找到消息，获取位置索引（index）
3. 使用相同 index 在所有 ChatModel 的 `chatHistoryList` 中定位对应消息
4. 对所有模型执行相同的数组更新操作

**替代方案**：修改 `startSendChatMessage` 预生成共享 ID → 被否决，需要修改现有发送流程，增加复杂度且可能引入新问题。

**替代方案**：按内容/时间戳匹配 → 被否决，不可靠，存在碰撞风险。

**理由**：位置索引是最可靠的定位方式。在正常操作流程中（发送中禁止编辑/重新生成），所有模型的 chatHistoryList 结构应保持一致。即使个别模型因发送失败导致消息缺失，辅助函数已设计了边界处理（AI 回复不存在时跳过）。

### 决策 6：Redux action 设计

**选择**：四个同步 reducer + 两个异步 thunk

| Action | 类型 | 说明 |
|--------|------|------|
| `copyMessage` | 组件本地处理 | 调用 `copyToClipboard`，成功后 Toast 提示，不经过 Redux |
| `commitEdit` | 同步 reducer | 原子更新用户消息和 AI 回复的 content/reasoningContent 数组（位置索引定位） |
| `rollbackEdit` | 同步 reducer | 编辑后重新生成失败时回滚两条消息的数组 |
| `commitRegenerate` | 同步 reducer | 将旧 AI 回复 push 进数组，追加空字符串占位（位置索引定位） |
| `rollbackRegenerate` | 同步 reducer | 重新生成失败时回滚 AI 回复数组（弹出占位元素） |
| `updateHistoryContent` | 同步 reducer | 流式完成后更新 AI 回复 content/reasoningContent 数组最后一个元素（替换占位空字符串），清理 runningChat 条目 |
| `editAndResendMessage` | 异步 thunk | dispatch commitEdit → 对每个启用模型裁剪历史并调用 streamChatCompletion → 流式完成后 dispatch updateHistoryContent → 失败时 dispatch rollbackEdit |
| `regenerateMessage` | 异步 thunk | dispatch commitRegenerate → 对每个启用模型裁剪历史并调用 streamChatCompletion → 流式完成后 dispatch updateHistoryContent → 失败时 dispatch rollbackRegenerate |

middleware 新增对 `commitEdit`、`editAndResendMessage.fulfilled`、`regenerateMessage.fulfilled` 的持久化监听（触发 `saveChatAndIndex`）。

**编辑/重新生成的流式流程说明**：

编辑和重新生成的 thunk **不能复用 `sendMessage`**。`sendMessage.fulfilled` 通过 `appendHistoryToModel` 追加新消息，而编辑/重新生成需要更新已有消息的 content 数组。thunk 需直接调用 `streamChatCompletion` 并自定义写回逻辑：

1. `editAndResendMessage`：dispatch `commitEdit` → 对每个模型裁剪历史为 `chatHistoryList.slice(0, userMessageIndex + 1)` → 调用 `streamChatCompletion` → 流式结果通过 `pushRunningChatHistory` 写入 `runningChat` → 完成后 dispatch `updateHistoryContent` 替换 AI 回复 content 数组占位元素
2. `regenerateMessage`：dispatch `commitRegenerate` → 对每个模型裁剪历史为 `chatHistoryList.slice(0, assistantMessageIndex)` → 调用 `streamChatCompletion` → 流式结果通过 `pushRunningChatHistory` 写入 `runningChat` → 完成后 dispatch `updateHistoryContent` 替换占位元素

两个 thunk 均需管理 `sendingChatIds`（pending 时加入，fulfilled/rejected 时移除）。

### 决策 7：ChatBubble 组件接口变更

**选择**：扩展 props 而非创建新组件

```typescript
interface ChatBubbleProps {
  role: ChatRoleEnum;
  content: string | string[];
  reasoningContent?: string | string[];
  isRunning?: boolean;
  // 新增
  messageId?: string;              // 消息唯一标识，用于操作回调
  isLatestUserMessage?: boolean;   // 是否为最新用户消息（控制编辑按钮）
  isLastAssistant?: boolean;       // 是否为最后一条 AI 回复（控制重新生成按钮）
  onCopy?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onRegenerate?: (messageId: string) => void;
}
```

`arePropsEqual` 比较函数同步扩展：新增 props 变化时触发重渲染。

**理由**：ChatBubble 已有 memo 优化，保持单一组件比创建 wrapper 更简洁。

## Risks / Trade-offs

- [多模型并发时编辑需对所有 ChatModel 生效] → 缓解：通过位置索引统一遍历 `chatModelList`，确保一致性
- [位置索引假设所有模型 chatHistoryList 结构一致] → 缓解：发送中禁止编辑，正常流程下结构一致；边界场景（AI 回复不存在）已在辅助函数中处理
- [操作栏始终显示可能增加每条消息的 DOM 节点数] → 缓解：操作栏 DOM 结构精简（纯图标按钮），对虚拟化性能影响可忽略
- [编辑模式的 textarea 在 Virtualizer 中可能有测量问题] → 缓解：编辑模式下该消息项使用固定高度估算，退出编辑模式后触发 Virtualizer 重新测量
- [`string | string[]` 联合类型增加消费端复杂度] → 缓解：提供 `getCurrentContent` helper 函数，TypeScript 类型检查确保不遗漏
- [重新生成失败时需回滚数组] → 缓解：`rollbackEdit` / `rollbackRegenerate` reducer 统一处理回滚逻辑，保证数据一致性

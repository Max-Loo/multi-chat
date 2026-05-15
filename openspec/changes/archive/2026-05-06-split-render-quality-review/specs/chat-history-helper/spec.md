## MODIFIED Requirements

### Requirement: 消息内容数组操作使用 resolveTargetIndex 辅助函数 + Immer draft 直接赋值
chatHistoryHelper 中 `commitRegenerate`、`rollbackRegenerate`、`updateHistoryContent` 三个函数 SHALL 使用共享的 `resolveTargetIndex` 辅助函数消除重复的索引 clamp 逻辑。数组元素替换 SHALL 直接使用 Immer draft 索引赋值（`arr[idx] = value`），而非创建新数组拷贝。

#### Scenario: resolveTargetIndex 正确计算 clamp 索引
- **WHEN** historyIndex 为 5 但 content 数组只有 3 个元素
- **THEN** resolveTargetIndex 返回 2（Math.min(5, 3-1)）

#### Scenario: resolveTargetIndex 对非数组内容返回 undefined
- **WHEN** content 为 string 类型（非数组）
- **THEN** resolveTargetIndex 返回 undefined

#### Scenario: Immer draft 中直接替换数组元素
- **WHEN** aiMessage.content 为 ["a", "b", "c"]（在 WritableDraft 上下文中），需要将索引 1 的元素替换为 "x"
- **THEN** 直接使用 `aiMessage.content[1] = "x"`，Immer 自动处理不可变性

#### Scenario: Immer draft 中非数组内容直接赋值
- **WHEN** aiMessage.content 为 "old"（非数组，在 WritableDraft 上下文中）
- **THEN** 直接使用 `aiMessage.content = "new"`，无需数组操作

### Requirement: findMessageIndex 保持遍历所有模型（已撤回优化）
findMessageIndex SHALL 保持遍历所有 chatModel 的 chatHistoryList 查找消息索引。每个模型的 chatHistoryList 使用独立的消息 ID（`generateUserMessageId()` 每次调用生成唯一 ID），"只查第一个模型"会导致非首选模型的重新生成功能失效。

#### Scenario: 消息存在于某个模型中
- **WHEN** 目标 messageId 在某个 chatModel 的 chatHistoryList 中
- **THEN** 遍历所有模型直到找到，返回该消息的索引位置

#### Scenario: 消息不存在
- **WHEN** 目标 messageId 不在任何 chatModel 的 chatHistoryList 中
- **THEN** 返回 -1

### Requirement: commitEdit 使用 Immer draft push 追加
在 `commitEdit` 中对 Immer draft 的 content 数组追加元素 SHALL 使用 `.push()` 方法，而非 `pushContent` 创建新数组。

#### Scenario: commitEdit 使用 push 追加
- **WHEN** 用户消息 content 为 ["v1", "v2"]（在 Immer draft 上下文中）
- **THEN** 使用 `content.push("v3")` 追加新版本，Immer 自动处理不可变性

## ADDED Requirements

### Requirement: 节流逻辑验证
系统 SHALL 在 `throttleInterval > 0` 时限制 yield 频率，仅在间隔到期后 yield 中间消息；流结束后 SHALL 立即 yield 未发送的更新。

#### Scenario: 节流间隔内的事件被延迟
- **WHEN** 设置 throttleInterval=100ms，连续产生 5 个 text-delta 事件，每个间隔 30ms（事件在 0/30/60/90/120ms 到达）
- **THEN** 前 4 个事件不 yield（均在 100ms 阈值内），到 ~120ms 时 yield 一次累积内容

#### Scenario: 流结束时有未发送更新则立即 yield
- **WHEN** 设置 throttleInterval=1000ms，流中有 1 个 text-delta 事件后流结束
- **THEN** 流结束后立即 yield 该累积内容（不等待节流间隔）

#### Scenario: throttleInterval=0 时每个事件都 yield（已有部分覆盖，作为节流对比基线）
- **WHEN** 设置 throttleInterval=0，流中有 3 个 text-delta 事件
- **THEN** 每个事件都立即 yield 一条中间消息，加上最终消息共 4 条（3 条中间 + 1 条最终）

### Requirement: 边界情况处理
系统 SHALL 正确处理缺失字段、null/undefined text 值等边界情况。

#### Scenario: text-delta 的 text 为 undefined
- **WHEN** 流中产生 type='text-delta' 且 text=undefined 的事件
- **THEN** content 累加空字符串（''），不抛出错误

#### Scenario: reasoning-delta 的 text 为 null
- **WHEN** 流中产生 type='reasoning-delta' 且 text=null 的事件
- **THEN** reasoningContent 累加空字符串（''），因为 `null ?? ''` 返回 `''`

#### Scenario: 不支持的事件类型被忽略
- **WHEN** 流中产生 type='tool-call' 或其他未知类型事件
- **THEN** 事件被忽略，content 和 reasoningContent 不变

### Requirement: 流式统计准确性
系统 SHALL 在最终消息的 raw.streamStats 中包含准确的 textDeltaCount、reasoningDeltaCount 和 duration。

#### Scenario: 统计计数与实际事件数匹配
- **WHEN** 流中有 5 个 text-delta 和 3 个 reasoning-delta
- **THEN** 最终消息的 raw.streamStats.textDeltaCount 为 5，reasoningDeltaCount 为 3

#### Scenario: duration 为非负数
- **WHEN** 流处理完成
- **THEN** 最终消息的 raw.streamStats.duration >= 0
